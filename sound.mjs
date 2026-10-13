// Created only from an explicit player gesture. Loading the page stays silent.
export function createDiscoverySound(manifest) {
  let context;
  let audio;
  const voices=new Set();
  function stop() {
    for(const oscillator of voices) { try{oscillator.stop();}catch{} }
    voices.clear();
    if(audio){audio.pause();audio.currentTime=0;}
  }
  function play() {
    if(!manifest) return;
    try {
      if(manifest.type==='file') {
        audio ??= new Audio(manifest.src);
        audio.currentTime=0;
        void audio.play().catch(()=>{});
        return;
      }
      const AudioContext=globalThis.AudioContext??globalThis.webkitAudioContext;
      if(!AudioContext) return;
      context ??= new AudioContext();
      if(context.state==='suspended') void context.resume().catch(()=>{});
      const start=context.currentTime;
      const duration=manifest.duration??0.45;
      for(const [i,frequency] of manifest.frequencies.entries()) {
        const oscillator=context.createOscillator();
        const gain=context.createGain();
        const time=start+i*0.055;
        oscillator.type='sine'; oscillator.frequency.value=frequency;
        gain.gain.setValueAtTime(0,time);
        gain.gain.linearRampToValueAtTime(0.055,time+0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001,time+duration);
        oscillator.connect(gain);gain.connect(context.destination);
        voices.add(oscillator);
        oscillator.onended=()=>{voices.delete(oscillator);oscillator.disconnect();gain.disconnect();};
        oscillator.start(time);oscillator.stop(time+duration+0.02);
      }
    } catch { /* Unsupported/blocked audio must never interrupt discoveries. */ }
  }
  return {play,stop};
}
