<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Opportunity extends Model
{
    protected $fillable = [
        'user_id',
        'app_id',
        'title',
        'developer',
        'icon_url',
        'rating',
        'installs',
        'installs_min',
        'reviews_count',
        'score',
        'category',
        'summary',
        'url',
        'is_bookmarked',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'float',
            'installs_min' => 'integer',
            'reviews_count' => 'integer',
            'score' => 'float',
            'is_bookmarked' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function analyses(): HasMany
    {
        return $this->hasMany(Analysis::class);
    }
}
