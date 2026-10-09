<?php

namespace App\Console\Commands;

use App\Jobs\RunScanJob;
use App\Models\ScanJob;
use App\Models\User;
use Illuminate\Console\Command;

/**
 * Queue one scan per watchlist keyword for every user, skipping keywords
 * that already have a pending/running scan or completed one in the last
 * 24 hours. Safe to run daily (idempotent).
 */
class ScanWatchlist extends Command
{
    protected $signature = 'watchlist:scan';
    protected $description = 'Queue automatic scans for the configured watchlist keywords.';

    public function handle(): int
    {
        $keywords = config('watchlist.keywords', []);
        if (! $keywords) {
            $this->warn('No watchlist keywords configured.');
            return self::SUCCESS;
        }

        $users = User::all();
        if ($users->isEmpty()) {
            $this->warn('No users yet; nothing to scan for.');
            return self::SUCCESS;
        }

        $queued = 0;
        foreach ($users as $user) {
            foreach ($keywords as $keyword) {
                if ($this->recentlyScanned($user->id, $keyword)) {
                    continue;
                }

                $scan = ScanJob::create([
                    'user_id' => $user->id,
                    'keyword' => $keyword,
                    'status' => ScanJob::STATUS_PENDING,
                ]);
                RunScanJob::dispatch($scan->id);
                $queued++;
            }
        }

        $this->info("Queued {$queued} watchlist scans.");
        return self::SUCCESS;
    }

    protected function recentlyScanned(int $userId, string $keyword): bool
    {
        return ScanJob::where('user_id', $userId)
            ->where('keyword', $keyword)
            ->where(function ($q) {
                $q->whereIn('status', [ScanJob::STATUS_PENDING, ScanJob::STATUS_RUNNING])
                    ->orWhere(function ($q) {
                        $q->where('status', ScanJob::STATUS_COMPLETED)
                            ->where('created_at', '>=', now()->subDay());
                    });
            })
            ->exists();
    }
}
