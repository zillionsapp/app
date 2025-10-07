<template>
  <div class="card bg-base-200 shadow-lg">
    <div class="card-body">
      <div class="flex items-center justify-between mb-4">
        <h2 class="card-title">Open Positions</h2>
        <div class="tabs tabs-boxed">
          <a class="tab tab-active">Recent Trades</a>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th class="text-white">Open Date</th>
              <th class="text-white">Symbol</th>
              <th class="text-white text-right">Net P&L</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>11-12-2023</td>
              <td>MRD</td>
              <td class="text-right text-success">$21.21</td>
            </tr>
            <tr>
              <td>11-12-2023</td>
              <td>MRD</td>
              <td class="text-right text-success">$134.21</td>
            </tr>
            <tr>
              <td>11-12-2023</td>
              <td>MRD</td>
              <td class="text-right text-success">$134.21</td>
            </tr>
            <tr>
              <td>11-12-2023</td>
              <td>MRD</td>
              <td class="text-right text-success">$523.21</td>
            </tr>
            <tr>
              <td>11-12-2023</td>
              <td>MRD</td>
              <td class="text-right text-success">$523.21</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// No props or logic needed for this static table component
</script>

<style scoped>
/* Component-specific styles if needed */
</style>
