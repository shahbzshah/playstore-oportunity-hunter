<?php

use App\Http\Controllers\Api\AiController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\OpportunityController;
use App\Http\Controllers\Api\ScanController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);

        Route::apiResource('scans', ScanController::class)->only(['index', 'store', 'show']);
        Route::apiResource('opportunities', OpportunityController::class);
        Route::post('analyze/{appId}', [AiController::class, 'analyze']);
    });
});
