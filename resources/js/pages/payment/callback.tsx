import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    Clock,
    CreditCard,
    Home,
    RotateCcw,
    ShieldAlert,
    XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface PaymentModel {
    id: number;
    amount: string | number;
    currency: string;
    status: string;
    transaction_id: string | null;
    created_at: string;
}

interface Props {
    status: 'success' | 'failed' | 'pending';
    payment?: PaymentModel | null;
    errorMessage?: string | null;
}

export default function CallbackPage({ status, payment, errorMessage }: Props) {
    const isSuccess = status === 'success';
    const isPending = status === 'pending';
    const isFailed = status === 'failed';

    return (
        <>
            <Head title={isSuccess ? 'Paiement Réussi' : 'Résultat du Paiement'} />

            <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 py-16 px-4 flex items-center justify-center">
                <Card className="max-w-lg w-full border-border/80 shadow-lg text-center overflow-hidden">
                    {/* Top status bar decoration */}
                    <div
                        className={`h-2 w-full ${
                            isSuccess
                                ? 'bg-emerald-500'
                                : isPending
                                  ? 'bg-amber-500'
                                  : 'bg-destructive'
                        }`}
                    />

                    <CardHeader className="pt-8 pb-4 space-y-4 flex flex-col items-center">
                        <div
                            className={`size-16 rounded-full flex items-center justify-center ${
                                isSuccess
                                    ? 'bg-emerald-500/10 text-emerald-500 ring-8 ring-emerald-500/5'
                                    : isPending
                                      ? 'bg-amber-500/10 text-amber-500 ring-8 ring-amber-500/5'
                                      : 'bg-destructive/10 text-destructive ring-8 ring-destructive/5'
                            }`}
                        >
                            {isSuccess && <CheckCircle2 className="size-8 stroke-[2.5]" />}
                            {isPending && <Clock className="size-8 stroke-[2.5]" />}
                            {isFailed && <XCircle className="size-8 stroke-[2.5]" />}
                        </div>

                        <div className="space-y-1">
                            <CardTitle className="text-2xl font-extrabold tracking-tight">
                                {isSuccess && 'Paiement CIB Confirmé !'}
                                {isPending && 'Paiement en cours de traitement'}
                                {isFailed && 'Le paiement a échoué'}
                            </CardTitle>
                            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
                                {isSuccess &&
                                    'Votre abonnement a été activé avec succès. Vous bénéficiez désormais de l\'accès complet aux cotations en direct.'}
                                {isPending &&
                                    'Votre transaction est en cours de validation auprès du serveur interbancaire SATIM. Votre abonnement s\'activera sous peu.'}
                                {isFailed &&
                                    (errorMessage ||
                                        'La transaction n\'a pas pu aboutir ou a été interrompue. Aucun débit n\'a été confirmé.')}
                            </p>
                        </div>
                    </CardHeader>

                    {payment && (
                        <CardContent className="px-6 py-4">
                            <div className="rounded-xl border bg-muted/40 p-4 text-xs space-y-2.5 text-left">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Numéro de reçu :</span>
                                    <span className="font-semibold text-foreground">#{payment.id}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Montant réglé :</span>
                                    <span className="font-bold text-foreground">
                                        {Number(payment.amount).toLocaleString('fr-DZ')} {payment.currency}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Moyen de règlement :</span>
                                    <span className="font-medium text-foreground">Carte CIB / Edahabiya</span>
                                </div>
                                {payment.transaction_id && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">N° Transaction SATIM :</span>
                                        <span className="font-mono text-[11px] text-muted-foreground">
                                            {payment.transaction_id}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-1 border-t border-border/50">
                                    <span className="text-muted-foreground">Statut :</span>
                                    <Badge
                                        variant="outline"
                                        className={
                                            isSuccess
                                                ? 'border-emerald-500/40 text-emerald-600 bg-emerald-500/10'
                                                : isPending
                                                  ? 'border-amber-500/40 text-amber-600 bg-amber-500/10'
                                                  : 'border-destructive/40 text-destructive bg-destructive/10'
                                        }
                                    >
                                        {isSuccess ? 'Validé' : isPending ? 'En cours' : 'Non validé'}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    )}

                    <CardFooter className="pt-4 pb-6 px-6 flex flex-col sm:flex-row gap-3 justify-center">
                        {isSuccess ? (
                            <Button asChild className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold">
                                <Link href="/dashboard">
                                    Accéder au tableau de bord
                                    <ArrowRight className="size-4 ml-2" />
                                </Link>
                            </Button>
                        ) : (
                            <>
                                <Button asChild variant="outline" className="w-full">
                                    <Link href="/subscription/checkout">
                                        <RotateCcw className="size-4 mr-2" />
                                        Réessayer le paiement
                                    </Link>
                                </Button>
                                <Button asChild variant="ghost" className="w-full">
                                    <Link href="/">
                                        <Home className="size-4 mr-2" />
                                        Retour à l'accueil
                                    </Link>
                                </Button>
                            </>
                        )}
                    </CardFooter>
                </Card>
            </div>
        </>
    );
}
