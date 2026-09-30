import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { home } from '@/routes';
import { Pyramid } from 'lucide-react';

export default function AuthCardLayout({
    children,
    title,
    description,
}: PropsWithChildren<{
    name?: string;
    title?: string;
    description?: string;
}>) {
    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 overflow-hidden bg-[#fafafa] p-6 md:p-10 dark:bg-zinc-950">
            {/* Background Accents */}
            <div className="pointer-events-none absolute top-0 left-0 h-full w-full overflow-hidden">
                <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-amber-500/5 blur-[120px]" />
                <div className="absolute -right-[10%] -bottom-[10%] h-[40%] w-[40%] rounded-full bg-amber-600/5 blur-[120px]" />
            </div>

            <div className="relative z-10 flex w-full max-w-md flex-col ">
                <Link
                    href={home()}
                    className="group flex flex-col items-center gap-3 self-center transition-all duration-300"
                >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-200 bg-white shadow-sm transition-all group-hover:scale-105 group-hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                        <Pyramid className="size-8 text-amber-600" />
                    </div>
                </Link>

                <div className="flex flex-col gap-6">
                    <Card className="overflow-hidden rounded-2xl border-zinc-200/60 shadow-xl shadow-zinc-200/20 dark:border-zinc-800/60 dark:shadow-none">
                        <CardHeader className="px-8 pt-8 pb-0 text-center">
                            <CardTitle className="text-2xl font-bold tracking-tight">
                                {title}
                            </CardTitle>
                            <CardDescription className="mt-2 text-balance text-zinc-500">
                                {description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-8 py-8">
                            {children}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
