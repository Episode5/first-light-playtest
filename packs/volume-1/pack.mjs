import * as content from './content.mjs';
export const PACK = Object.freeze({
  ...content, id:'volume-1', title:'First Light — Volume 1', volumeLabel:'Volume 1',
  version:'0.3', savePrefix:'first-light:volume-1:save:',
  legacySaveKeys:['doodle-god-exp:save:prototype-0.2.0','doodle-god-exp:save:prototype-0.1.0'],
  theme:'./packs/volume-1/theme.css', themeColor:'#071719',
  shareUrl:'https://episode5.github.io/first-light-playtest/',
  nextVolumeText:'Volume 2 is in the works',
  sounds:{discovery:{type:'synth', frequencies:[523.25,659.25,783.99], duration:0.45}}
});
