<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class SalesAnalyticsService
{
    /** statuts où l'argent est effectivement encaissé */
    private const CONCRETIZED = ['paid', 'completed'];

    /** statuts encore en cours de négociation ou en attente de paiement */
    private const PIPELINE = ['under_negotiation', 'confirmed'];

    /** statuts où la vente est perdue */
    private const LOST = ['cancelled', 'refunded'];

    private const ALL_STATUSES = [
        'under_negotiation', 'confirmed', 'paid', 'completed', 'cancelled', 'refunded',
    ];

    public function build(int $days): array
    {
        $from = today()->subDays($days - 1);
        $to = today()->endOfDay();
        $previousFrom = $from->copy()->subDays($days);
        $previousTo = $from->copy()->subSecond();

        return [
            'period' => [
                'days' => $days,
                'from' => $from->toDateString(),
                'to' => today()->toDateString(),
            ],
            'summary' => $this->summary($from, $to, $previousFrom, $previousTo),
            'by_status' => $this->byStatus($from, $to),
            'by_item_type' => $this->byItemType($from, $to),
            'timeseries' => $this->timeseries($from, $days),
            'top_products' => $this->topItems('product_id', 'products', 'name', $from, $to),
            'top_rentals' => $this->topItems('rental_id', 'rentals', 'title', $from, $to),
            'top_services' => $this->topItems('service_id', 'services', 'title', $from, $to),
            'top_resellers' => $this->topResellers($from, $to),
            'top_suppliers' => $this->topSuppliers($from, $to),
        ];
    }

    private function inPeriod(Carbon $from, Carbon $to)
    {
        // colonne qualifiée : les tables jointes ont aussi un created_at
        return Order::query()->whereBetween('orders.created_at', [$from, $to]);
    }

    private function summary(Carbon $from, Carbon $to, Carbon $previousFrom, Carbon $previousTo): array
    {
        $totalOrders = $this->inPeriod($from, $to)->count();
        $concretized = $this->inPeriod($from, $to)->whereIn('status', self::CONCRETIZED);
        $concretizedOrders = (clone $concretized)->count();
        $revenue = (float) (clone $concretized)->sum('total_amount');

        $previousConcretized = $this->inPeriod($previousFrom, $previousTo)
            ->whereIn('status', self::CONCRETIZED);
        $previousOrders = (clone $previousConcretized)->count();
        $previousRevenue = (float) (clone $previousConcretized)->sum('total_amount');

        return [
            'total_orders' => $totalOrders,
            'concretized_orders' => $concretizedOrders,
            'conversion_rate' => $totalOrders > 0
                ? round($concretizedOrders / $totalOrders * 100, 2)
                : 0,
            'revenue' => round($revenue, 2),
            'average_order_value' => $concretizedOrders > 0
                ? round($revenue / $concretizedOrders, 2)
                : 0,
            'pending_orders' => $this->inPeriod($from, $to)->whereIn('status', self::PIPELINE)->count(),
            'pending_amount' => round((float) $this->inPeriod($from, $to)
                ->whereIn('status', self::PIPELINE)->sum('total_amount'), 2),
            'lost_orders' => $this->inPeriod($from, $to)->whereIn('status', self::LOST)->count(),
            'lost_amount' => round((float) $this->inPeriod($from, $to)
                ->whereIn('status', self::LOST)->sum('total_amount'), 2),
            'commission_total' => round((float) (clone $concretized)->sum('commission_amount'), 2),
            'previous' => [
                'revenue' => round($previousRevenue, 2),
                'concretized_orders' => $previousOrders,
            ],
            'growth' => [
                'revenue_pct' => $this->growth($revenue, $previousRevenue),
                'orders_pct' => $this->growth($concretizedOrders, $previousOrders),
            ],
        ];
    }

    /** une croissance depuis zéro n'a pas de pourcentage défini, on renvoie null */
    private function growth(float $current, float $previous): ?float
    {
        if ($previous == 0.0) {
            return $current > 0 ? null : 0.0;
        }

        return round(($current - $previous) / $previous * 100, 2);
    }

    private function byStatus(Carbon $from, Carbon $to): Collection
    {
        $rows = $this->inPeriod($from, $to)
            ->selectRaw('status, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as amount')
            ->groupBy('status')
            ->get()
            ->keyBy('status');

        return collect(self::ALL_STATUSES)->map(fn ($status) => [
            'status' => $status,
            'count' => (int) ($rows[$status]->count ?? 0),
            'amount' => round((float) ($rows[$status]->amount ?? 0), 2),
        ])->values();
    }

    private function byItemType(Carbon $from, Carbon $to): Collection
    {
        $columns = ['product' => 'product_id', 'rental' => 'rental_id', 'service' => 'service_id'];

        return collect($columns)->map(function ($column, $type) use ($from, $to) {
            $query = $this->inPeriod($from, $to)
                ->whereNotNull($column)
                ->whereIn('status', self::CONCRETIZED);

            return [
                'type' => $type,
                'count' => (clone $query)->count(),
                'revenue' => round((float) (clone $query)->sum('total_amount'), 2),
            ];
        })->values();
    }

    private function timeseries(Carbon $from, int $days): Collection
    {
        $rows = Order::query()
            ->whereIn('status', self::CONCRETIZED)
            ->where('created_at', '>=', $from)
            ->selectRaw('DATE(created_at) as date, COALESCE(SUM(total_amount), 0) as revenue, COUNT(*) as orders')
            ->groupBy('date')
            ->get()
            ->keyBy('date');

        // les jours sans vente sont rebouchés pour obtenir une série continue
        return collect(range($days - 1, 0))->map(function ($offset) use ($rows) {
            $date = today()->subDays($offset)->toDateString();

            return [
                'date' => $date,
                'revenue' => round((float) ($rows[$date]->revenue ?? 0), 2),
                'orders' => (int) ($rows[$date]->orders ?? 0),
            ];
        })->values();
    }

    private function topItems(string $foreignKey, string $table, string $labelColumn, Carbon $from, Carbon $to): Collection
    {
        return $this->inPeriod($from, $to)
            ->join($table, "orders.{$foreignKey}", '=', "{$table}.id")
            ->whereIn('orders.status', self::CONCRETIZED)
            ->groupBy("{$table}.id", "{$table}.{$labelColumn}")
            ->selectRaw("{$table}.id as id, {$table}.{$labelColumn} as name, COUNT(*) as orders, COALESCE(SUM(orders.quantity), 0) as quantity, COALESCE(SUM(orders.total_amount), 0) as revenue")
            ->orderByDesc('revenue')
            ->limit(10)
            ->get()
            ->map(fn ($row) => [
                'id' => (int) $row->id,
                'name' => $row->name,
                'orders' => (int) $row->orders,
                'quantity' => (int) $row->quantity,
                'revenue' => round((float) $row->revenue, 2),
            ]);
    }

    private function topResellers(Carbon $from, Carbon $to): Collection
    {
        $concretizedList = "'" . implode("','", self::CONCRETIZED) . "'";

        return $this->inPeriod($from, $to)
            ->join('users', 'orders.reseller', '=', 'users.id')
            ->whereNotNull('orders.reseller')
            ->groupBy('users.id', 'users.name')
            ->selectRaw("users.id as id, users.name as name,
                COUNT(*) as total_orders,
                SUM(CASE WHEN orders.status IN ({$concretizedList}) THEN 1 ELSE 0 END) as concretized_orders,
                COALESCE(SUM(CASE WHEN orders.status IN ({$concretizedList}) THEN orders.total_amount ELSE 0 END), 0) as revenue,
                COALESCE(SUM(CASE WHEN orders.status IN ({$concretizedList}) THEN orders.commission_amount ELSE 0 END), 0) as commission_earned")
            ->orderByDesc('revenue')
            ->limit(10)
            ->get()
            ->map(function ($row) {
                $total = (int) $row->total_orders;
                $concretized = (int) $row->concretized_orders;

                return [
                    'id' => (int) $row->id,
                    'name' => $row->name,
                    'total_orders' => $total,
                    'concretized_orders' => $concretized,
                    'revenue' => round((float) $row->revenue, 2),
                    'commission_earned' => round((float) $row->commission_earned, 2),
                    'conversion_rate' => $total > 0 ? round($concretized / $total * 100, 2) : 0,
                ];
            });
    }

    /**
     * Les commandes ne portent pas de supplier_id : le fournisseur est le
     * propriétaire de l'item vendu. On agrège donc les trois types séparément
     * avant de fusionner par utilisateur.
     */
    private function topSuppliers(Carbon $from, Carbon $to): Collection
    {
        $tables = ['products' => 'product_id', 'rentals' => 'rental_id', 'services' => 'service_id'];
        $totals = [];

        foreach ($tables as $table => $foreignKey) {
            $rows = $this->inPeriod($from, $to)
                ->join($table, "orders.{$foreignKey}", '=', "{$table}.id")
                ->join('users', "{$table}.user_id", '=', 'users.id')
                ->whereIn('orders.status', self::CONCRETIZED)
                ->groupBy('users.id', 'users.name')
                ->selectRaw('users.id as id, users.name as name, COUNT(*) as orders, COALESCE(SUM(orders.total_amount), 0) as revenue')
                ->get();

            foreach ($rows as $row) {
                $id = (int) $row->id;
                $totals[$id] ??= ['id' => $id, 'name' => $row->name, 'orders' => 0, 'revenue' => 0.0];
                $totals[$id]['orders'] += (int) $row->orders;
                $totals[$id]['revenue'] += (float) $row->revenue;
            }
        }

        return collect($totals)
            ->map(fn ($supplier) => [...$supplier, 'revenue' => round($supplier['revenue'], 2)])
            ->sortByDesc('revenue')
            ->take(10)
            ->values();
    }
}
