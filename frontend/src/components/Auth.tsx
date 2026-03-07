import { supabase } from '@/lib/supabase'
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useTheme } from '@/hooks/ThemeContext'

export function Auth() {
    const { theme } = useTheme()

    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
            <div className="w-full max-w-md p-8 bg-card rounded-xl border shadow-sm">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold tracking-tight mb-2">
                        <span className="text-blue-500">Echo</span>
                        <span className="text-emerald-500">Access</span>
                    </h1>
                    <p className="text-muted-foreground text-sm">Sign in to your account</p>
                </div>
                <SupabaseAuth
                    supabaseClient={supabase}
                    theme={theme === "dark" ? "dark" : "default"}
                    appearance={{
                        theme: ThemeSupa,
                        variables: {
                            default: {
                                colors: {
                                    brand: '#3b82f6',
                                    brandAccent: '#10b981',
                                }
                            }
                        }
                    }}
                    providers={['github', 'google']}
                />
            </div>
        </div>
    )
}
