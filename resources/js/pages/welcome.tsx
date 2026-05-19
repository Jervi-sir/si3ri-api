import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { dashboard, login, register } from '@/routes';

export default function Welcome({
    canLogin = true,
    canRegister = true,
}: {
    canLogin?: boolean;
    canRegister?: boolean;
}) {
    const { auth } = usePage().props;

    return (
        <div className="flex min-h-screen flex-col bg-white text-[#1b1b18] dark:bg-[#050505] dark:text-[#EDEDEC]">
            <Head title="Si3ri | Intelligence de l'Or en temps réel" />

            <nav className="container mx-auto flex h-20 items-center justify-between px-6">
                <Link href="/" className="flex items-center gap-2.5">
                    <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-amber-500 text-white shadow-lg shadow-amber-500/20 dark:bg-amber-600">
                        <AppLogoIcon className="size-5 fill-current" />
                    </div>
                    <span className="text-xl font-black tracking-tighter uppercase">
                        Si3ri
                    </span>
                </Link>

                <div className="flex items-center gap-4">
                    {auth.user ? (
                        <Button
                            asChild
                            variant="outline"
                            className="rounded-full px-6"
                        >
                            <Link href={dashboard()}>Tableau de bord</Link>
                        </Button>
                    ) : (
                        <>
                            {canLogin && (
                                <Button
                                    asChild
                                    variant="ghost"
                                    className="rounded-full px-6"
                                >
                                    <Link href={login()}>Connexion</Link>
                                </Button>
                            )}
                            {canRegister && (
                                <Button
                                    asChild
                                    className="rounded-full bg-amber-500 px-6 font-bold hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
                                >
                                    <Link href={register()}>Commencer</Link>
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </nav>

            <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
                <div className="mx-auto max-w-3xl space-y-8">
                    <div className="inline-flex rounded-full bg-amber-50 px-4 py-1.5 text-xs font-bold text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                        DONNÉES DE MARCHÉ DE PRÉCISION
                    </div>

                    <h1 className="text-5xl font-black tracking-tight sm:text-7xl">
                        L'intelligence de l'Or en temps réel <br />
                        <span className="text-amber-500">Simplifiée.</span>
                    </h1>

                    <p className="mx-auto max-w-xl text-lg text-neutral-500 dark:text-neutral-400">
                        Optimisez votre activité de bijouterie avec des cours de
                        l'or et des données de devises précis. L'intelligence de
                        marché professionnelle à votre portée.
                    </p>

                    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Button
                            size="lg"
                            className="h-14 rounded-full bg-black px-10 text-lg font-bold text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                            asChild
                        >
                            <Link href={register()} className="group">
                                Essai Gratuit
                                <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </Button>
                    </div>

                    <div className="flex items-center justify-center gap-10 pt-10 opacity-50">
                        <div className="text-center">
                            <div className="text-2xl font-black">24kt</div>
                            <div className="text-[10px] font-bold tracking-widest uppercase">
                                Prix Spot
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-black">150+</div>
                            <div className="text-[10px] font-bold tracking-widest uppercase">
                                Devises
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-black">0.01s</div>
                            <div className="text-[10px] font-bold tracking-widest uppercase">
                                Précision
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="container mx-auto flex h-20 items-center justify-between border-t border-neutral-100 px-6 text-[10px] font-bold tracking-widest text-neutral-400 uppercase dark:border-neutral-900">
                <span>© {new Date().getFullYear()} Si3ri Market Data</span>
                <div className="flex gap-6">
                    <Link href="#" className="hover:text-amber-500">
                        Conditions
                    </Link>
                    <Link href="#" className="hover:text-amber-500">
                        Confidentialité
                    </Link>
                </div>
            </footer>
        </div>
    );
}
