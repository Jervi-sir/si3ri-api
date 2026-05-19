import { Head, useForm, Link, router } from '@inertiajs/react';
import {
    Calculator,
    TrendingUp,
    DollarSign,
    Euro,
    RefreshCw,
    Gem,
    ArrowUpRight,
    Clock,
    Lock,
    Coins,
} from 'lucide-react';
import { useState } from 'react';
import SubscriptionController from '@/actions/App/Http/Controllers/SubscriptionController';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tableau de bord',
        href: dashboard().url,
    },
];

interface DashboardProps {
    data: {
        spot: {
            gold: number;
            silver: number;
            copper: number;
            last_updated: string;
        };
        rates: {
            usd_dzd: number;
            eur_dzd: number;
        };
        gold_dzd: Record<
            string,
            {
                raw: number;
                local: number;
                italian: number;
            }
        >;
        silver_dzd: {
            gram: number;
        };
    };
    isSubscribed: boolean;
}

export default function Dashboard({ data, isSubscribed }: DashboardProps) {
    const [processing, setProcessing] = useState(false);
    const [weight, setWeight] = useState<string>('');
    const [karat, setKarat] = useState<string>('18k');
    const [origin, setOrigin] = useState<'local' | 'italian'>('local');

    const handleRefresh = () => {
        setProcessing(true);
        // Just reload the data from the database, the backend handles the hourly sync.
        router.reload({
            only: ['data'],
            onFinish: () => setProcessing(false),
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-DZ', {
            style: 'currency',
            currency: 'DZD',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const currentPricePerGram = data.gold_dzd[karat]?.[origin] || 0;
    const totalCalcPrice = weight
        ? parseFloat(weight) * currentPricePerGram
        : 0;

    if (!isSubscribed) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Abonnement requis" />
                <div className="flex flex-1 items-center justify-center p-4">
                    <Card className="w-full max-w-md border-2 border-dashed">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 w-fit rounded-full bg-amber-100 p-3">
                                <Lock className="h-8 w-8 text-amber-600" />
                            </div>
                            <CardTitle className="text-2xl">
                                Accès Premium requis
                            </CardTitle>
                            <CardDescription>
                                Abonnez-vous à Si3ri pour accéder aux prix du marché en temps réel,
                                aux taux de change et au calculateur professionnel.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center pb-8">
                            <Button
                                asChild
                                className="bg-amber-600 px-8 text-white hover:bg-amber-700"
                            >
                                <Link
                                    href={SubscriptionController.checkout().url}
                                >
                                    Passer à l'abonnement
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Suivi de l'or en direct" />

            <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 md:p-8">
                {/* Top Stats Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-none bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg">
                        <CardHeader className="pb-2">
                            <CardDescription className="font-medium text-amber-100">
                                Cours de l'or
                            </CardDescription>
                            <CardTitle className="flex items-center justify-between text-3xl font-bold">
                                ${data.spot.gold.toLocaleString()}
                                <Gem className="h-6 w-6 text-amber-200 opacity-50" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-1 text-xs text-amber-100/80">
                                <Clock className="h-3 w-3" /> Mis à jour le{' '}
                                {data.spot.last_updated}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                        <CardHeader className="pb-2 text-slate-500">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                    USD / DZD
                                </span>
                                <DollarSign className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {data.rates.usd_dzd} DA
                            </div>
                            <div className="mt-1 flex items-center text-xs text-emerald-500">
                                <ArrowUpRight className="mr-1 h-3 w-3" />{' '}
                                Marché parallèle
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                        <CardHeader className="pb-2 text-slate-500">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                    EUR / DZD
                                </span>
                                <Euro className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {data.rates.eur_dzd} DA
                            </div>
                            <div className="mt-1 flex items-center text-xs text-emerald-500">
                                <ArrowUpRight className="mr-1 h-3 w-3" />{' '}
                                Marché parallèle
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                        <CardHeader className="pb-2 text-slate-500">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                    Gramme d'argent
                                </span>
                                <Coins className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(data.silver_dzd.gram)}
                            </div>
                            <div className="mt-1 text-xs text-zinc-400">
                                Cours au comptant : ${data.spot.silver}/oz
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Calculator Section */}
                    <Card className="overflow-hidden border-zinc-200 shadow-md lg:col-span-12 dark:border-zinc-800">
                        <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-amber-600" />
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <Calculator className="h-5 w-5 text-amber-500" />
                                    Calculateur de vente intelligent
                                </CardTitle>
                                <CardDescription>
                                    Calculs instantanés du prix de l'or pour les clients
                                </CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRefresh}
                                disabled={processing}
                                className="gap-2"
                            >
                                {processing ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="h-4 w-4" />
                                )}
                                Actualiser les prix
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Poids du métal (en grammes)</Label>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            value={weight}
                                            onChange={(e) =>
                                                setWeight(e.target.value)
                                            }
                                            className="h-12 text-lg font-bold"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Carat</Label>
                                            <select
                                                className="h-10 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm dark:border-zinc-800"
                                                value={karat}
                                                onChange={(e) =>
                                                    setKarat(e.target.value)
                                                }
                                            >
                                                <option value="18k">
                                                    18 Carats
                                                </option>
                                                <option value="19k">
                                                    19 Carats
                                                </option>
                                                <option value="21k">
                                                    21 Carats
                                                </option>
                                                <option value="24k">
                                                    24 Carats
                                                </option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Qualité</Label>
                                            <select
                                                className="h-10 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm dark:border-zinc-800"
                                                value={origin}
                                                onChange={(e) =>
                                                    setOrigin(
                                                        e.target.value as any,
                                                    )
                                                }
                                            >
                                                <option value="local">
                                                    Local
                                                </option>
                                                <option value="italian">
                                                    Italien (Importé)
                                                </option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-6 md:col-span-2 dark:border-zinc-800 dark:bg-zinc-800/20">
                                    <span className="mb-2 text-xs font-bold tracking-widest text-zinc-500 uppercase">
                                        Prix total estimé
                                    </span>
                                    <div className="text-5xl font-black tracking-tighter text-zinc-900 dark:text-white">
                                        {formatCurrency(totalCalcPrice)}
                                    </div>
                                    <div className="mt-4 flex gap-4 text-sm text-zinc-400">
                                        <div className="flex items-center gap-1">
                                            <span className="font-bold text-zinc-500">
                                                Taux :
                                            </span>
                                            {formatCurrency(
                                                currentPricePerGram,
                                            )}
                                            /g
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="font-bold text-zinc-500">
                                                Origine :
                                            </span>
                                            {origin === 'local'
                                                ? '🇩🇿 Local'
                                                : '🇮🇹 Italien'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Reference Table */}
                    <Card className="border-zinc-200 lg:col-span-12 dark:border-zinc-800">
                        <CardHeader className="pb-0">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <TrendingUp className="h-5 w-5 text-zinc-500" />
                                Prix de référence (DZD par gramme)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-zinc-100 dark:border-zinc-800">
                                            <th className="pb-4 text-sm font-bold text-zinc-500">
                                                TYPE DE CARAT
                                            </th>
                                            <th className="pb-4 text-right text-sm font-bold text-zinc-500">
                                                VALEUR BRUTE
                                            </th>
                                            <th className="pb-4 text-right text-sm font-bold text-emerald-600">
                                                MARCHÉ LOCAL
                                            </th>
                                            <th className="pb-4 text-right text-sm font-bold text-amber-600">
                                                OR ITALIEN
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-50 dark:divide-zinc-900">
                                        {Object.entries(data.gold_dzd).map(
                                            ([k, values]) => (
                                                <tr
                                                    key={k}
                                                    className="group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                                                >
                                                    <td className="py-4 text-xl font-black text-zinc-900 uppercase dark:text-zinc-100">
                                                        {k}
                                                    </td>
                                                    <td className="py-4 text-right font-mono text-sm text-zinc-400">
                                                        {formatCurrency(
                                                            values.raw,
                                                        )}
                                                    </td>
                                                    <td className="py-4 text-right text-lg font-bold text-emerald-700 dark:text-emerald-500">
                                                        {formatCurrency(
                                                            values.local,
                                                        )}
                                                    </td>
                                                    <td className="py-4 text-right text-lg font-bold text-amber-900 dark:text-amber-500">
                                                        {formatCurrency(
                                                            values.italian,
                                                        )}
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
