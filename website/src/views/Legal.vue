<template>
  <div>
    <h1>This is a page for all the legal stuff</h1>
  </div>
</template>

<script>
  import titleMixin from '@/mixins/title';

  export default {
    name: 'Legal',
    mixins: [
      titleMixin,
    ],
    title: 'Legal',
  };
</script>
