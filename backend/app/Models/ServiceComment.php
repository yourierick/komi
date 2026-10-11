<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceComment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'service_id',
        'comment',
        'rating',
        'approved',
    ];

    protected $casts = [
        'rating' => 'decimal:2',
        'approved' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }
}
