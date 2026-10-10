<?php

use App\Http\Controllers\Api\AiController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\OpportunityController;
use App\Http\Controllers\Api\ScanController;
use App\Http\Controllers\Api\IdeaController;
use App\Http\Controllers\Api\ScheduledScanController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);

    // External cron trigger for automatic watchlist scans (token auth).
    Route::post('scheduled/watchlist', [ScheduledScanController::class, 'watchlist']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);

        Route::apiResource('scans', ScanController::class)->only(['index', 'store', 'show']);
        Route::apiResource('opportunities', OpportunityController::class);
        Route::post('analyze/{appId}', [AiController::class, 'analyze']);
        Route::delete('analyses/{analysis}', [AiController::class, 'destroy']);

        Route::get('ideas', [IdeaController::class, 'index']);
        Route::post('ideas/analyze', [IdeaController::class, 'analyze']);
    });
});
