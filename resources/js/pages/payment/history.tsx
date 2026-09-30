import { Head, Link } from '@inertiajs/react';
import {
    ArrowUpRight,
    BadgeCheck,
    Calendar,
    CheckCircle2,
    Clock,
    CreditCard,
    Crown,
    ExternalLink,
    HelpCircle,
    History,
    Receipt,
    RotateCcw,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Wallet,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface SubscriptionModel {
    id: number;
    plan_name: string;
    status: string;
    starts_at: string;
    ends_at: string | null;
}

interface PaymentRecord {
    id: number;
    amount: string | number;
    currency: string;
    status: string;
    payment_method: string;
    transaction_id: string | null;
    receipt_path: string | null;
    created_at: string;
    subscription?: SubscriptionModel | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedPayments {
    data: PaymentRecord[];
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
}

interface Props {
    currentSubscription?: SubscriptionModel | null;
    payments: PaginatedPayments;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tableau de Bord',
        href: '/dashboard',
    },
    {
        title: 'Historique des Règlements',
        href: '/subscription/history',
    },
];

export default function PaymentHistoryPage({ currentSubscription, payments }: Props) {
    const isSubscribed = Boolean(
        currentSubscription &&
            (currentSubscription.status === 'active' ||
                !currentSubscription.ends_at ||
                new Date(currentSubscription.ends_at) > new Date()),
    );

    const totalSpent = payments.data
        .filter((p) => p.status === 'succeeded')
        .reduce((sum, p) => sum + Number(p.amount), 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Historique des Règlements & Factures" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-[1400px] mx-auto w-full">
                {/* Header with Title & Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <Receipt className="h-5 w-5" />
                            </div>
                            <h1 className="text-2xl font-black tracking-tight text-foreground">
                                Historique des Règlements
                            </h1>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            Consultez l'état de vos abonnements et les reçus de vos transactions CIB & Edahabiya.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Button
                            asChild
                            size="sm"
                            className="rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-xs"
                        >
                            <Link href="/subscription/checkout">
                                <Crown className="size-4 mr-1.5" />
                                {isSubscribed ? 'Renouveler / Changer de Formule' : 'Souscrire un Abonnement'}
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Status & Summary Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Subscription Status Card */}
                    <Card className="rounded-2xl border bg-gradient-to-br from-card via-card to-amber-500/5 shadow-sm">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <span className="text-xs font-semibold text-muted-foreground">Statut d'Accès</span>
                            <Badge
                                variant="outline"
                                className={
                                    isSubscribed
                                        ? 'border-emerald-500/40 text-emerald-600 bg-emerald-500/10 font-bold'
                                        : 'border-amber-500/40 text-amber-600 bg-amber-500/10 font-bold'
                                }
                            >
                                {isSubscribed ? 'Actif' : 'Inactif / Expiré'}
                            </Badge>
                        </CardHeader>
                        <CardContent className="space-y-1">
                            <div className="text-xl font-extrabold text-foreground">
                                {currentSubscription?.plan_name || 'Aucun abonnement actif'}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {currentSubscription?.ends_at
                                    ? `Valide jusqu'au ${new Date(currentSubscription.ends_at).toLocaleDateString('fr-DZ', {
                                          day: '2-digit',
                                          month: 'long',
                                          year: 'numeric',
                                      })}`
                                    : isSubscribed
                                      ? 'Accès permanent'
                                      : 'Souscrivez pour débloquer le flux en direct'}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Total Transactions Card */}
                    <Card className="rounded-2xl border bg-card shadow-sm">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <span className="text-xs font-semibold text-muted-foreground">Transactions</span>
                            <Wallet className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="space-y-1">
                            <div className="text-xl font-extrabold text-foreground">
                                {payments.total} règlement{payments.total > 1 ? 's' : ''}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Enregistré{payments.total > 1 ? 's' : ''} sur le compte
                            </p>
                        </CardContent>
                    </Card>

                    {/* Security Guarantee Card */}
                    <Card className="rounded-2xl border bg-card shadow-sm">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <span className="text-xs font-semibold text-muted-foreground">Passerelle Interbancaire</span>
                            <ShieldCheck className="size-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent className="space-y-1">
                            <div className="text-xl font-extrabold text-foreground flex items-center gap-2">
                                <span>SATIM / Sofizpay</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Protocole sécurisé 256-bit pour CIB & Edahabiya
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Payments Table Card */}
                <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-border/60 flex items-center justify-between">
                        <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                            <History className="size-4 text-amber-500" />
                            Historique des Paiements
                        </h3>
                        <span className="text-xs text-muted-foreground font-mono">
                            Affichage de {payments.from || 0} à {payments.to || 0} sur {payments.total}
                        </span>
                    </div>

                    {payments.data.length === 0 ? (
                        <div className="py-16 text-center space-y-3 px-4">
                            <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                                <Receipt className="size-6" />
                            </div>
                            <h4 className="text-base font-bold text-foreground">Aucun paiement enregistré</h4>
                            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                Vous n'avez pas encore effectué de transaction CIB ou Edahabiya sur votre compte.
                            </p>
                            <div className="pt-2">
                                <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">
                                    <Link href="/subscription/checkout">Effectuer un Paiement</Link>
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead>
                                    <tr className="border-b bg-muted/30 text-muted-foreground">
                                        <th className="py-3 px-5 font-semibold">N° Reçu & Date</th>
                                        <th className="py-3 px-4 font-semibold">Description / Forfait</th>
                                        <th className="py-3 px-4 font-semibold">Moyen de Règlement</th>
                                        <th className="py-3 px-4 font-semibold">N° Réf SATIM</th>
                                        <th className="py-3 px-4 font-semibold">Montant</th>
                                        <th className="py-3 px-5 font-semibold text-right">Statut</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {payments.data.map((p) => (
                                        <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                                            <td className="py-3.5 px-5">
                                                <div className="font-bold text-foreground font-mono">
                                                    #{p.id}
                                                </div>
                                                <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    <Clock className="size-3" />
                                                    {new Date(p.created_at).toLocaleDateString('fr-DZ', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 font-medium text-foreground">
                                                {p.subscription?.plan_name || 'Abonnement Si3ri Pro'}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-1.5 font-medium text-foreground">
                                                    <CreditCard className="size-3.5 text-amber-500" />
                                                    Carte CIB / Edahabiya
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 font-mono text-[11px] text-muted-foreground">
                                                {p.transaction_id || '-'}
                                            </td>
                                            <td className="py-3.5 px-4 font-bold text-foreground text-sm font-mono">
                                                {Number(p.amount).toLocaleString('fr-DZ')}{' '}
                                                <span className="text-xs font-normal text-muted-foreground">
                                                    {p.currency}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-5 text-right">
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        p.status === 'succeeded'
                                                            ? 'border-emerald-500/40 text-emerald-600 bg-emerald-500/10 font-bold'
                                                            : p.status === 'pending'
                                                              ? 'border-amber-500/40 text-amber-600 bg-amber-500/10 font-bold'
                                                              : 'border-destructive/40 text-destructive bg-destructive/10 font-bold'
                                                    }
                                                >
                                                    {p.status === 'succeeded'
                                                        ? 'Validé'
                                                        : p.status === 'pending'
                                                          ? 'En attente'
                                                          : 'Échoué'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination Links */}
                    {payments.links && payments.links.length > 3 && (
                        <div className="p-4 border-t border-border/60 flex items-center justify-between flex-wrap gap-2">
                            <span className="text-xs text-muted-foreground">
                                Page {payments.current_page} sur {payments.last_page}
                            </span>
                            <div className="flex items-center gap-1">
                                {payments.links.map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.url || '#'}
                                        preserveScroll
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                                            link.active
                                                ? 'bg-amber-500 text-slate-950 shadow-xs'
                                                : link.url
                                                  ? 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                                  : 'text-muted-foreground/40 pointer-events-none'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
