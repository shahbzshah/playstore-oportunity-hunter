<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

/**
 * Trigger for the daily automatic watchlist scans. Called by an external
 * cron (the free-tier backend sleeps, so an in-app scheduler would never
 * fire). Protected by a shared SCHEDULER_TOKEN env var, not user auth.
 */
class ScheduledScanController extends Controller
{
    public function watchlist(Request $request)
    {
        $token = config('services.scheduler.token');
        if (! $token || $request->bearerToken() !== $token) {
            abort(401, 'Invalid scheduler token.');
        }

        Artisan::call('watchlist:scan');

        return response()->json([
            'ok' => true,
            'output' => trim(Artisan::output()),
        ]);
    }
}
