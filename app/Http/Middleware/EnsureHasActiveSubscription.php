<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureHasActiveSubscription
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // 1. If not authenticated, let auth middleware handle or redirect
        if (! $user) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Non authentifié.',
                ], 401);
            }

            return redirect()->guest(route('login'));
        }

        // 2. Check if user has an active subscription or bypass privileges
        if (! $user->hasActiveSubscription()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Un abonnement actif est requis pour accéder à cette ressource.',
                    'subscription_required' => true,
                    'checkout_url' => route('payment.checkout'),
                ], 403);
            }

            return redirect()->route('payment.checkout')->with('warning', 'Votre abonnement a expiré ou est inactif. Veuillez choisir une formule pour continuer.');
        }

        return $next($request);
    }
}
