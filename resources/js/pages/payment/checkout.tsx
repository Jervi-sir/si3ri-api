import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    BadgeCheck,
    Check,
    CheckCircle2,
    Coins,
    CreditCard,
    Crown,
    History,
    LineChart,
    Loader2,
    Lock,
    Phone,
    Receipt,
    Scale,
    Shield,
    ShieldCheck,
    Sparkles,
    Zap,
} from 'lucide-react';
import { useState } from 'react';
import { initiate as initiatePayment } from '@/actions/App/Http/Controllers/Payment/PaymentController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Plan {
    name: string;
    price: number;
    months: number;
    description: string;
}

interface Subscription {
    id: number;
    plan_name: string;
    status: string;
    starts_at: string;
    ends_at: string | null;
}

interface Props {
    plans: Record<string, Plan>;
    currentSubscription?: Subscription | null;
    sofizpayConfigured: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tableau de Bord',
        href: '/dashboard',
    },
    {
        title: 'Abonnement & Paiement',
        href: '/subscription/checkout',
    },
];

export default function CheckoutPage({
    plans,
    currentSubscription,
    sofizpayConfigured,
}: Props) {
    const planKey = Object.keys(plans)[0] || 'pro';
    const plan = plans[planKey] || {
        name: 'Accès Illimité Si3ri Pro',
        price: 25000,
        months: 12,
        description:
            "La solution de référence pour les bijoutiers en Algérie : cotations de l'or en direct, devises du Square, calculateur de marge et analyses graphiques.",
    };

    const [phone, setPhone] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const isSubscribed = Boolean(
        currentSubscription &&
        (currentSubscription.status === 'active' ||
            !currentSubscription.ends_at ||
            new Date(currentSubscription.ends_at) > new Date()),
    );

    const monthlyEquivalent = Math.round(plan.price / (plan.months || 12));

    const handlePay = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        setIsSubmitting(true);

        try {
            const res = await fetch(initiatePayment.url(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({
                    plan_key: planKey,
                    phone: phone.trim() ? phone.trim() : undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(
                    data.message || 'Erreur lors de la création de la transaction CIB/Edahabiya.',
                );
            }

            if (data.payment_url) {
                window.location.href = data.payment_url;
            } else {
                throw new Error('URL de paiement introuvable.');
            }
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : 'Une erreur inattendue est survenue.';
            setErrorMessage(message);
            setIsSubmitting(false);
        }
    };

    function getCsrfToken(): string {
        const match = document.cookie.match(new RegExp('(^|;\\s*)(XSRF-TOKEN)=([^;]*)'));
        return match ? decodeURIComponent(match[3]) : '';
    }

    const proFeatures = [
        {
            title: 'Cotations de l’Or en direct',
            desc: 'Cours instantané pour le 24K, 22K, 21K, 18K, 18K Italien, 14K et l’or cassé.',
            icon: Coins,
        },
        {
            title: 'Taux des Devises du Square & Officiels',
            desc: 'EUR / USD marché parallèle (Square Port-Saïd) et taux bancaires officiels actualisés.',
            icon: Sparkles,
        },
        {
            title: 'Calculateur Intelligent de Bijouterie',
            desc: 'Simulation précise de vos prix d’achat/vente, marge brute et façonnage en 1 clic.',
            icon: Scale,
        },
        {
            title: 'Historiques & Graphiques Interactifs',
            desc: 'Suivez les tendances sur 24h, 7 jours, 1 mois et 1 an pour anticiper le marché.',
            icon: LineChart,
        },
        {
            title: 'Alertes & Mises à Jour en continu',
            desc: 'Flux automatisé rafraîchi en continu pour ne rater aucune fluctuation.',
            icon: Zap,
        },
        {
            title: 'Support Prioritaire & Multi-appareils',
            desc: 'Accès fluide et optimisé sur Smartphone, Tablette et Ordinateur de comptoir.',
            icon: ShieldCheck,
        },
    ];

    return (
        <>
            <Head title="Abonnement Si3ri Pro - Paiement CIB / Edahabiya" />

            <div className="flex flex-1 flex-col gap-8 p-4 md:p-8 max-w-[1400px] mx-auto w-full">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                            <Crown className="size-3.5" />
                            <span>Offre Professionnelle Exclusive</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                            Abonnement Si3ri Pro
                        </h1>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Button asChild variant="outline" size="sm" className="rounded-xl border-border/80">
                            <Link href="/subscription/history">
                                <History className="size-4 mr-1.5" />
                                Historique des Règlements
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Active Subscription Alert Banner */}
                {isSubscribed && (
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                        <div className="flex items-center gap-3.5">
                            <div className="size-10 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                                <BadgeCheck className="size-6 stroke-[2.5]" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
                                    Votre abonnement est actuellement actif
                                </h4>
                                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                                    {currentSubscription?.ends_at
                                        ? `Valide jusqu'au ${new Date(currentSubscription.ends_at).toLocaleDateString('fr-DZ', { day: '2-digit', month: 'long', year: 'numeric' })}`
                                        : 'Accès permanent illimité'}
                                </p>
                            </div>
                        </div>
                        <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
                            <Link href="/dashboard">Accéder au Dashboard</Link>
                        </Button>
                    </div>
                )}

                {/* Sandbox notice if account not configured */}
                {!sofizpayConfigured && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-3">
                        <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span>
                            <strong>Environnement Sandbox :</strong> Passerelle de test active. Vos paiements CIB/Edahabiya sont simulés en environnement sécurisé.
                        </span>
                    </div>
                )}

                {errorMessage && (
                    <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-3 animate-in fade-in duration-200">
                        <AlertCircle className="size-5 shrink-0" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                {/* Main Pricing & Features Card Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                    {/* Features Column (7 cols) */}
                    <div className="lg:col-span-7 flex flex-col justify-between rounded-3xl border border-border/80 bg-card/60 p-7 sm:p-9 shadow-sm backdrop-blur-md">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-500">
                                    <Sparkles className="size-3.5" />
                                    Tout inclus dans votre forfait
                                </div>
                                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                                    L'arsenal complet pour piloter votre activité
                                </h2>
                                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                    Ne travaillez plus à l'aveugle. Profitez des données de marché les plus fiables d'Algérie directement sur votre comptoir.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                {proFeatures.map((feat, index) => {
                                    const Icon = feat.icon;
                                    return (
                                        <div
                                            key={index}
                                            className="group rounded-2xl border border-border/50 bg-background/50 p-4 transition-all duration-200 hover:border-amber-500/30 hover:bg-background/80"
                                        >
                                            <div className="size-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110">
                                                <Icon className="size-4" />
                                            </div>
                                            <h3 className="text-xs font-bold text-foreground mb-1">
                                                {feat.title}
                                            </h3>
                                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                {feat.desc}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Shield className="size-4 text-emerald-500" />
                                <span>Paiement sécurisé SATIM</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Zap className="size-4 text-amber-500" />
                                <span>Activation instantanée</span>
                            </div>
                        </div>
                    </div>

                    {/* Pricing & Checkout Column (5 cols) */}
                    <div className="lg:col-span-5 relative flex flex-col justify-between rounded-3xl border-2 border-amber-500/60 bg-gradient-to-b from-card via-card to-amber-500/[0.04] p-7 sm:p-8 shadow-xl shadow-amber-500/5 backdrop-blur-md">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Badge className="bg-amber-500 hover:bg-amber-500 text-black font-extrabold px-2.5 py-0.5 text-[11px] uppercase tracking-wider">
                                        Forfait Annuel 12 Mois
                                    </Badge>
                                    <h3 className="text-xl font-extrabold text-foreground pt-1">
                                        {plan.name}
                                    </h3>
                                </div>
                                <div className="size-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                                    <Crown className="size-5" />
                                </div>
                            </div>

                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {plan.description}
                            </p>

                            {/* Big Price Block */}
                            <div className="rounded-2xl border border-border/80 bg-background/60 p-5 text-center space-y-1">
                                <div className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                                    Tarif Professionnel
                                </div>
                                <div className="flex items-baseline justify-center gap-1.5 pt-1">
                                    <span className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
                                        {plan.price.toLocaleString('fr-DZ')}
                                    </span>
                                    <span className="text-base font-bold text-amber-500">DZD</span>
                                    <span className="text-xs font-semibold text-muted-foreground">/ an</span>
                                </div>
                                <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 pt-1">
                                    Soit seulement ~{monthlyEquivalent.toLocaleString('fr-DZ')} DZD / mois (2 mois offerts)
                                </div>
                            </div>

                            {/* Payment Form */}
                            <form onSubmit={handlePay} className="space-y-4 pt-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="phone" className="text-xs font-semibold text-foreground flex items-center justify-between">
                                        <span>Numéro de téléphone</span>
                                        <span className="text-[10px] text-muted-foreground font-normal">Reçu / confirmation</span>
                                    </Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                                        <Input
                                            id="phone"
                                            type="tel"
                                            placeholder="05 / 06 / 07 XX XX XX XX"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="pl-10 h-10 rounded-xl bg-background/80 text-xs border-border focus:border-amber-500"
                                        />
                                    </div>
                                </div>

                                <div className="rounded-xl bg-muted/40 border border-border/50 p-3 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="size-4 text-amber-500 shrink-0" />
                                        <span className="font-semibold text-foreground">CIB & Edahabiya</span>
                                    </div>
                                    <span className="text-[11px] text-muted-foreground font-mono">SATIM 256-bit</span>
                                </div>

                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={isSubmitting}
                                    className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-yellow-600 text-black font-extrabold shadow-lg shadow-amber-500/20 transition-all duration-200 active:scale-[0.99]"
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center gap-2 text-black">
                                            <Loader2 className="size-4 animate-spin" />
                                            <span>Connexion au guichet SATIM...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2">
                                            <span>Payer {plan.price.toLocaleString('fr-DZ')} DZD avec CIB / Edahabiya</span>
                                            <ArrowRight className="size-4" />
                                        </div>
                                    )}
                                </Button>
                            </form>
                        </div>

                        <div className="mt-6 pt-4 text-center">
                            <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
                                <Lock className="size-3 text-emerald-500" />
                                Paiement 100% sécurisé via le réseau interbancaire algérien.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
