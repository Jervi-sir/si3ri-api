<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MetalService;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function index(MetalService $service): JsonResponse
    {
        return response()->json($service->getDashboardData());
    }
}
