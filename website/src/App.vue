<template>
  <v-app>
    <v-app-bar
      app
    >
      <v-btn
        :href='cdfHyperlink'
        target='_blank'
        text
      >
        CDF
      </v-btn>

      <v-spacer />

      <v-btn
        to='/'
        text
      >
        Home
      </v-btn>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script>
  export default {
    name: 'App',

    components: {
    },

    data () {
      return {
        cdfHyperlink: 'https://cdf.moe',
      };
    },

    created () {
      this.$vuetify.theme.dark = true;
    },

    beforeMount () {
      this.setCDFHyperlink();
    },

    methods: {
      async setCDFHyperlink () {
        const res = await fetch('https://api.pushshift.io/reddit/search/submission/?subreddit=anime&size=1&author=animemod&&title=casual%20discussion%20fridays');
        if (res.ok) {
          const { data } = await res.json();
          this.cdfHyperlink = data[0].full_link;
        }
      },
    },
  };
</script>

<style lang='scss'>
@import '@/styles/fonts';
@import '@/styles/colors';
@import '@/styles/variables';
@import '@/styles/overrides/index';
</style>
