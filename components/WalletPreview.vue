<template>
  <div class="bg-base-100 p-6 rounded-t-2xl">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <div>
          <h3 class="font-semibold text-base-content">{{ $t('app.wallet.portfolio_dashboard') }}</h3>
          <p class="text-xs text-base-content/60">{{ $t('app.wallet.live_trading_performance') }}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 bg-success rounded-full animate-pulse"></div>
        <span class="text-xs text-success font-medium">{{ $t('app.wallet.active') }}</span>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 gap-4 mb-6">
      <div class="bg-base-200/50 rounded-xl p-4">
        <div class="text-xs text-primary uppercase font-bold tracking-widest mb-1">{{ $t('app.wallet.total_deposited') }}</div>
        <div class="text-xl font-bold text-base-content">$12,500</div>
        <div class="text-xs text-base-content/60 mt-1">{{ $t('app.wallet.paper_money_invested') }}</div>
      </div>
      <div class="bg-base-200/50 rounded-xl p-4">
        <div class="text-xs text-secondary uppercase font-bold tracking-widest mb-1">{{ $t('app.wallet.balance_left') }}</div>
        <div class="text-xl font-bold text-base-content">$8,750</div>
        <div class="text-xs text-base-content/60 mt-1">{{ $t('app.wallet.available_to_trade') }}</div>
      </div>
      <div class="bg-base-200/50 rounded-xl p-4">
        <div class="text-xs text-accent uppercase font-bold tracking-widest mb-1">{{ $t('app.wallet.total_equity') }}</div>
        <div class="text-xl font-bold text-base-content">$15,230</div>
        <div class="text-xs text-base-content/60 mt-1">{{ $t('app.wallet.current_portfolio_value') }}</div>
      </div>
      <div class="bg-base-200/50 rounded-xl p-4">
        <div class="text-xs text-info uppercase font-bold tracking-widest mb-1">{{ $t('app.wallet.total_pnl') }}</div>
        <div class="text-xl font-bold text-success">+$2,730</div>
        <div class="text-xs text-success mt-1">+21.84%</div>
      </div>
    </div>

    <!-- Mini Chart -->
    <div class="bg-base-200/30 rounded-xl p-4 mb-4 w-full">
      <div class="flex items-center justify-between mb-3">
        <span class="text-sm font-medium text-base-content">{{ $t('app.wallet.performance_30d') }}</span>
        <div class="flex gap-1">
          <div class="w-2 h-2 bg-success rounded-full"></div>
          <span class="text-xs text-success">+21.8%</span>
        </div>
      </div>
      <div class="h-20 flex items-end justify-between gap-0.5 w-full">
        <div class="flex-1 bg-success rounded-t" style="height: 85%"></div>
        <div class="flex-1 bg-success rounded-t" style="height: 90%"></div>
        <div class="flex-1 bg-success rounded-t" style="height: 95%"></div>
        <div class="flex-1 bg-success rounded-t" style="height: 100%"></div>
        <div class="flex-1 bg-success rounded-t" style="height: 95%"></div>
        <div class="flex-1 bg-success rounded-t" style="height: 98%"></div>
        <div class="flex-1 bg-success rounded-t" style="height: 100%"></div>
        <div class="flex-1 bg-success rounded-t" style="height: 97%"></div>
        <div class="flex-1 bg-success rounded-t" style="height: 100%"></div>
        <div class="flex-1 bg-success rounded-t" style="height: 95%"></div>
        <div class="flex-1 bg-success rounded-t" style="height: 98%"></div>
        <div class="flex-1 bg-success rounded-t" style="height: 100%"></div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="flex gap-2">
      <button class="btn btn-primary btn-sm flex-1">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
        </svg>
        {{ $t('app.wallet.deposit') }}
      </button>
      <button class="btn btn-outline btn-sm flex-1">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.409l-7-14z"/>
        </svg>
        {{ $t('app.wallet.send') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// Mock data for the wallet preview
// This component displays a static preview of the wallet dashboard
</script>