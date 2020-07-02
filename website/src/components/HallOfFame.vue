<template>
  <v-container fluid>
    <v-row class='d-flex flex-column'>
      <v-col
        v-for='(member, i) in hallOfFamers'
        :key='i'
        :style='member.style'
      >
        <v-card>
          <v-card-title>
            <a :href='`https://reddit.com/u/${member.username}`'>/u/{{ member.username }}</a>
          </v-card-title>
          <!-- eslint-disable-next-line vue/no-v-html | self-written html just in the json instead of here -->
          <v-card-text v-html='member.tagline' />
          <v-card-actions
            v-if='member.art'
          >
            <v-btn
              text
              @click='hallOfFamers[i].expand = !hallOfFamers[i].expand'
            >
              Show art
            </v-btn>
          </v-card-actions>
          <v-expand-transition>
            <v-sheet
              v-show='member.expand'
            >
              <iframe
                v-for='(art, j) in member.art'
                :key='j'
                :src='embedify(art)'
                style='width: 390px; height: 355px; border: 0;'
              />
            </v-sheet>
          </v-expand-transition>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
  import parse from 'url-parse';
  import HallOfFamers from '@/assets/text/HallOfFame.json';

  export default {
    name: 'HallOfFame',

    data () {
      return {
        hallOfFamers: HallOfFamers['hall-of-famers'].map((hallOfFamer) => ({ expand: false, ...hallOfFamer })),
      };
    },

    methods: {
      embedifyPixiv (pathname) {
        console.log(pathname);
        const id = pathname.match(/\d+$/);
        console.log(id);
        return `https://embed.pixiv.net/embed_mk2.php?id=${id}&size=medium`;
      },

      embedify (url) {
        const parsed = parse(url);
        switch (parsed.hostname) {
          case 'www.pixiv.net':
            return this.embedifyPixiv(parsed.pathname);
          default:
            return '';
        }
      },
    },
  };
</script>
