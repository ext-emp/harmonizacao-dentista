// Ponto único de importação do GSAP e dos plugins (todos gratuitos desde a 3.13).
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);

export { gsap, ScrollTrigger, SplitText, CustomEase };
