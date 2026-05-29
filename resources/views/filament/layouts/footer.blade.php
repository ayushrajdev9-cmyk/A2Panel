<footer class="flex flex-col items-center justify-center text-center space-y-2 py-6 text-gray-400 dark:text-gray-500 border-t border-indigo-100/20 dark:border-indigo-900/10">
    {{ \Filament\Support\Facades\FilamentView::renderHook(\App\Enums\CustomRenderHooks::FooterStart->value) }}

    <div class="flex items-center gap-2 text-sm">
        <span class="opacity-60">&copy; {{ date('Y') }}</span>
        <span class="font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_200%] animate-pulse bg-clip-text text-transparent tracking-tight">A2Panel</span>
        <span class="opacity-20">✦</span>
        <span class="opacity-50"><a class="font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent hover:from-indigo-300 hover:to-purple-300 transition-all duration-300" href="https://github.com/ayushrajdev9-cmyk/A2Panel" target="_blank">A2Panel</a></span>
    </div>

    @if(config('app.debug'))
        <div class="flex items-center gap-1.5 text-xs opacity-40">
            <x-filament::icon
                :icon="'tabler-clock'"
                @class(['w-3.5 h-3.5'])
            />
            <span>{{ round(microtime(true) - LARAVEL_START, 3) }}s</span>
        </div>
    @endif

    {{ \Filament\Support\Facades\FilamentView::renderHook(\App\Enums\CustomRenderHooks::FooterEnd->value) }}
</footer>
