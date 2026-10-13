// First Light — Volume 1 content. Original hand-authored content; no runtime AI.
// Fixed unordered pairs, stable concept IDs, semantic groups, and deterministic validation.
export const GRAPH_VERSION = 'volume-1-0.3.0';
export const STARTER_IDS = Object.freeze(['water','fire','earth','air','human','time']);

export const CATEGORY_LABELS = Object.freeze({
  primordial:'Primordial', natural:'Nature', material:'Materials', life:'Life',
  making:'Making', settlement:'Civilization', knowledge:'Knowledge',
  technology:'Technology', culture:'Culture'
});

const rows = [
  ['water','Water','primordial'],['fire','Fire','primordial'],['earth','Earth','primordial'],
  ['air','Air','primordial'],['human','Human','primordial'],['time','Time','primordial'],
  ['mud','Mud','natural'],['steam','Steam','natural'],['dust','Dust','natural'],
  ['lava','Lava','natural'],['energy','Energy','natural'],['stone','Stone','natural'],
  ['sand','Sand','material'],['gravel','Gravel','material'],['ore','Ore','material'],
  ['metal','Metal','material'],['glass','Glass','material'],['clay','Clay','material'],
  ['brick','Brick','material'],['pottery','Pottery','material'],
  ['life','Life','life'],['algae','Algae','life'],['plant','Plant','life'],
  ['seed','Seed','life'],['tree','Tree','life'],['forest','Forest','life'],
  ['animal','Animal','life'],['fish','Fish','life'],
  ['tool','Tool','making'],['wood','Wood','making'],['shelter','Shelter','making'],
  ['wheel','Wheel','making'],['cart','Cart','making'],
  ['house','House','settlement'],['village','Village','settlement'],['city','City','settlement'],
  ['knowledge','Knowledge','knowledge'],['writing','Writing','knowledge'],
  ['book','Book','knowledge'],['school','School','knowledge'],
  ['experiment','Experiment','knowledge'],['science','Science','knowledge'],
  ['electricity','Electricity','technology'],['circuit','Circuit','technology'],
  ['machine','Machine','technology'],['engine','Engine','technology'],
  ['vehicle','Vehicle','technology'],['computer','Computer','technology'],
  ['network','Network','technology'],['communication','Communication','technology'],
  ['sound','Sound','culture'],['music','Music','culture'],['rhythm','Rhythm','culture'],
  ['society','Society','culture'],['culture','Culture','culture'],
  ['trade','Trade','culture'],['market','Market','culture'],['history','History','knowledge'],
  ['cloud','Cloud','natural'],['rain','Rain','natural'],['storm','Storm','natural'],
  ['lightning','Lightning','natural'],['ocean','Ocean','natural'],['mountain','Mountain','natural'],
  ['river','River','natural'],['volcano','Volcano','natural'],['smoke','Smoke','natural'],
  ['ash','Ash','natural'],['sky','Sky','natural'],['space','Space','natural'],['star','Star','natural'],
  ['coal','Coal','material'],['steel','Steel','material'],['paper','Paper','material'],
  ['ink','Ink','material'],['fiber','Fiber','material'],['fabric','Fabric','material'],['rope','Rope','material'],
  ['bacteria','Bacteria','life'],['fungus','Fungus','life'],['flower','Flower','life'],
  ['fruit','Fruit','life'],['bird','Bird','life'],['insect','Insect','life'],
  ['boat','Boat','making'],['sail','Sail','making'],['bridge','Bridge','making'],['road','Road','making'],
  ['farm','Farm','settlement'],['factory','Factory','settlement'],['library','Library','settlement'],
  ['language','Language','knowledge'],['mathematics','Mathematics','knowledge'],
  ['map','Map','knowledge'],['astronomy','Astronomy','knowledge'],
  ['radio','Radio','technology'],['internet','Internet','technology'],['robot','Robot','technology'],
  ['satellite','Satellite','technology'],['story','Story','culture']
];
export const ELEMENTS = Object.freeze(rows.map(([id,name,group]) => Object.freeze({id,name,group,groupName:CATEGORY_LABELS[group]})));

const laws = [
  'water+earth=mud','water+fire=steam','earth+air=dust','earth+fire=lava',
  'fire+air=energy','lava+water=stone','lava+time=stone',
  'stone+time=sand','stone+stone=gravel','gravel+water=sand',
  'earth+stone=ore','ore+fire=metal','sand+fire=glass','mud+time=clay',
  'mud+fire=brick','clay+fire=pottery',
  'water+energy=life','life+water=algae','life+earth=plant',
  'plant+life=seed','seed+earth=plant','plant+time=tree',
  'tree+tree=forest','life+forest=animal','animal+water=fish',
  'human+stone=tool','tree+tool=wood','human+wood=shelter',
  'tool+wood=wheel','wheel+wood=cart','shelter+brick=house',
  'house+house=village','village+village=city',
  'human+time=knowledge','knowledge+tool=writing','writing+wood=book',
  'book+human=school','knowledge+energy=experiment','experiment+time=science',
  'science+energy=electricity','electricity+metal=circuit',
  'tool+metal=machine','machine+energy=engine','engine+wheel=vehicle',
  'machine+circuit=computer','computer+computer=network',
  'network+human=communication','energy+air=sound','human+sound=music',
  'music+time=rhythm','human+human=society','society+music=culture',
  'society+cart=trade','trade+city=market','knowledge+writing=history',

  'air+water=cloud','cloud+water=rain','cloud+energy=storm','storm+energy=lightning',
  'water+water=ocean','earth+earth=mountain','mountain+water=river','mountain+fire=volcano',
  'fire+wood=smoke','fire+tree=ash','air+air=sky','sky+time=space','fire+space=star',
  'forest+time=coal','metal+coal=steel','wood+knowledge=paper','coal+water=ink',
  'plant+tool=fiber','fiber+human=fabric','fiber+tool=rope',
  'life+mud=bacteria','life+tree=fungus','plant+energy=flower','flower+time=fruit',
  'animal+air=bird','animal+plant=insect',
  'wood+water=boat','boat+fabric=sail','wood+river=bridge','stone+cart=road',
  'plant+human=farm','machine+city=factory','book+city=library',
  'human+communication=language','knowledge+rhythm=mathematics','writing+earth=map','science+sky=astronomy',
  'communication+electricity=radio','network+communication=internet','computer+machine=robot',
  'communication+space=satellite','human+writing=story',

  'rain+earth=mud','rain+plant=flower','river+time=sand','volcano+water=stone','volcano+air=ash',
  'ocean+life=fish','ocean+air=storm','sky+energy=lightning','space+science=astronomy',
  'coal+fire=energy','steel+tool=machine','paper+ink=writing','paper+human=book',
  'rope+wood=bridge','insect+plant=life','boat+ocean=trade','boat+river=trade','road+cart=trade',
  'factory+electricity=machine','library+human=school','language+writing=book','language+society=culture',
  'map+cart=trade','radio+human=communication','internet+human=communication','satellite+communication=network',
  'story+society=culture','story+time=history','fruit+human=trade','bird+air=sound',
  'fungus+forest=life','farm+time=village','farm+human=society','steel+wheel=vehicle'
];
export const RECIPES = Object.freeze(laws.map((law,index) => {
  const [pair,resultId]=law.split('=');
  const [inputAId,inputBId]=pair.split('+');
  return Object.freeze({id:`proto-recipe-${String(index+1).padStart(3,'0')}`,inputAId,inputBId,resultId,
    status:'active',priority:0,variantPrerequisites:Object.freeze([])});
}));

