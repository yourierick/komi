<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = ['key', 'value'];

    public const PAYMENT_METHODS = [
        'cash_on_delivery',
        'payment_in_store',
        'manual_payment_via_mobile_money',
        'payment_by_bank_transfer',
        'payment_by_physical_deposit',
        'payment_protected_by_komi',
    ];

    /**
     * registre des paramètres connus : validation, type et valeur par défaut.
     * une clé absente de ce schéma n'est ni lue ni écrite par l'admin.
     */
    public const SCHEMA = [
        'komi_fee_percentage' => [
            'type' => 'float',
            'rules' => 'numeric|min:0|max:100',
            'default' => 0,
        ],
        'max_reseller_commission_percentage' => [
            'type' => 'float',
            'rules' => 'numeric|min:0|max:100',
            'default' => 20,
        ],
        'reviews_auto_approve' => [
            'type' => 'bool',
            'rules' => 'boolean',
            'default' => true,
        ],
        'registration_enabled' => [
            'type' => 'bool',
            'rules' => 'boolean',
            'default' => true,
        ],
        'payment_methods_enabled' => [
            'type' => 'array',
            'rules' => 'array',
            'element_rules' => 'in:cash_on_delivery,payment_in_store,manual_payment_via_mobile_money,payment_by_bank_transfer,payment_by_physical_deposit,payment_protected_by_komi',
            'default' => self::PAYMENT_METHODS,
        ],
    ];

    /** méthode socle de la marketplace : elle ne peut pas être désactivée */
    public const MANDATORY_PAYMENT_METHOD = 'payment_protected_by_komi';

    public static function value(string $key, mixed $default = null): mixed
    {
        return static::query()->where('key', $key)->value('value') ?? $default;
    }

    public static function set(string $key, mixed $value): void
    {
        $type = self::SCHEMA[$key]['type'] ?? 'string';
        $encoded = match ($type) {
            'bool' => $value ? '1' : '0',
            'array' => json_encode(array_values((array) $value)),
            default => (string) $value,
        };

        static::updateOrCreate(['key' => $key], ['value' => $encoded]);
    }

    // nommé snapshot() car all() entre en conflit avec Model::all()
    public static function snapshot(): array
    {
        $stored = static::pluck('value', 'key');
        $settings = [];

        foreach (self::SCHEMA as $key => $meta) {
            $settings[$key] = isset($stored[$key])
                ? self::decode($stored[$key], $meta['type'])
                : $meta['default'];
        }

        return $settings;
    }

    private static function decode(string $raw, string $type): mixed
    {
        return match ($type) {
            'bool' => $raw === '1' || $raw === 'true',
            'float' => (float) $raw,
            'array' => json_decode($raw, true) ?? [],
            default => $raw,
        };
    }

    // pas de taux configuré = pas de frais : rien n'est prélevé tant que
    // l'admin n'a pas explicitement défini komi_fee_percentage
    public static function komiFeePercentage(): float
    {
        return (float) static::value('komi_fee_percentage', self::SCHEMA['komi_fee_percentage']['default']);
    }

    public static function maxResellerCommissionPercentage(): float
    {
        return (float) static::value('max_reseller_commission_percentage', self::SCHEMA['max_reseller_commission_percentage']['default']);
    }

    public static function reviewsAutoApprove(): bool
    {
        return static::bool('reviews_auto_approve', true);
    }

    public static function registrationEnabled(): bool
    {
        return static::bool('registration_enabled', true);
    }

    public static function enabledPaymentMethods(): array
    {
        $raw = static::value('payment_methods_enabled');
        $methods = $raw === null ? self::PAYMENT_METHODS : (json_decode($raw, true) ?? []);

        // garde-fou : même si la valeur stockée l'omet, la méthode socle reste active
        return array_values(array_unique([...$methods, self::MANDATORY_PAYMENT_METHOD]));
    }

    private static function bool(string $key, bool $default): bool
    {
        $raw = static::value($key);

        return $raw === null ? $default : self::decode($raw, 'bool');
    }
}
