<template>
  <stack
    ref='stack'
    :column-min-width='800'
    :gutter-width='50'
    :gutter-height='50'
  >
    <stack-item
      v-for='(member, i) in hallOfFamers'
      :key='i'
      :style='member.style'
    >
      <v-card
        class='mx-auto'
        width='800'
      >
        <v-container class='pa-0'>
          <v-row class='ma-0'>
            <v-col class='pa-0'>
              <v-card-title>
                <a :href='`https://reddit.com/u/${member.username}`'>/u/{{ member.username }}</a>
              </v-card-title>
              <!-- eslint-disable-next-line vue/no-v-html vue/max-attributes-per-line | self-written html just in the json instead of here -->
              <v-card-text :class='$style.tagline' v-html='member.tagline' />
            </v-col>
          </v-row>
          <v-row
            v-if='member.art && member.art.length > 0'
            class='ma-0'
          >
            <v-col class='pa-0'>
              <v-card
                :class='$style["image-primary"]'
                :href='member.art[0].link ? member.art[0].link : ""'
                target='_blank'
                flat
                tile
              >
                <v-img
                  :src='require(`@/assets/fanart/${member.art[0].name}.jpg`)'
                  @load='onImageLoad'
                />
              </v-card>
            </v-col>
          </v-row>
          <v-row class='ma-0'>
            <v-col class='pa-0'>
              <v-card-actions
                v-if='member.art && member.art.length > 1'
              >
                <v-btn
                  text
                  @click='onExpansion(i)'
                >
                  {{ hallOfFamers[i].expand ? 'Hide all art' : 'Show all art' }}
                </v-btn>
              </v-card-actions>
            </v-col>
          </v-row>
          <v-row
            v-if='member.art && member.art.length > 1'
            class='ma-0'
          >
            <v-col class='pa-0'>
              <v-expand-transition>
                <v-sheet
                  v-show='member.expand'
                >
                  <v-container>
                    <v-row
                      class='d-flex'
                      justify='center'
                    >
                      <v-col
                        v-for='(art, j) in member.art'
                        :key='j'
                        class='pa-1'
                      >
                        <v-sheet class='mx-auto'>
                          <v-card
                            :class='$style["image-secondary"]'
                            :href='member.art[j].link ? member.art[j].link : ""'
                            target='_blank'
                            flat
                            tile
                          >
                            <v-img
                              :src='require(`@/assets/fanart/${member.art[j].name}.jpg`)'
                              @load='onImageLoad'
                            />
                          </v-card>
                        </v-sheet>
                      </v-col>
                    </v-row>
                  </v-container>
                </v-sheet>
              </v-expand-transition>
            </v-col>
          </v-row>
        </v-container>
      </v-card>
    </stack-item>
  </stack>
</template>

<script>
  import { debounce } from 'vue-debounce';
  import { Stack, StackItem } from 'vue-stack-grid';

  import HallOfFamers from '@/assets/text/HallOfFame.json';

  export default {
    name: 'HallOfFame',

    components: {
      Stack,
      StackItem,
    },

    data () {
      return {
        hallOfFamers: HallOfFamers['hall-of-famers'].map((hallOfFamer) => ({ expand: false, ...hallOfFamer })),
        debouncedReflow: debounce(() => this.$nextTick(() => { this.$nextTick(() => { console.log('yeet'); this.$refs.stack.reflow(); }); }), '300ms'),
      };
    },

    methods: {
      onImageLoad (val) {
        console.log(val);
        this.debouncedReflow();
      },
      onExpansion (index) {
        console.log('expanding');
        this.hallOfFamers[index].expand = !this.hallOfFamers[index].expand;
        this.$nextTick(() => this.debouncedReflow());
      },
    },
  };
</script>

<style lang='scss' module>
  .tagline {
    color: map-get($solarized, 'yellow');
  }

  .image {
    &-primary {
      width: 800px;
    }
    &-secondary {
      width: 350px;
    }
  }
</style>
