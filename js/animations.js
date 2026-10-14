/* ==========================================================================
   VAN HARMONIE — Animations (avec la bibliothèque Motion)
   --------------------------------------------------------------------------
   Motion (https://motion.dev) est une bibliothèque d'animation. Elle est
   chargée dans chaque page HTML, juste avant ce fichier, par la ligne :
   <script src="https://cdn.jsdelivr.net/npm/motion@13.4.6/dist/motion.js" ...>

   Une fois chargée, elle met à disposition un objet nommé "Motion" qui
   contient des outils. On en utilise 4 :
     - animate(élément, valeurs, options) : anime un élément
     - inView(éléments, fonction)         : lance la fonction quand un élément
                                            entre dans l'écran (au défilement)
     - hover(éléments, fonction)          : lance la fonction au survol souris
     - stagger(délai)                     : décale les animations d'un groupe
                                            (l'une après l'autre, en cascade)

   Ce fichier contient :
     1. Les vérifications de départ (réglage « réduire les animations »)
     2. L'apparition douce des sections au défilement
     3. L'effet au survol des cartes de packs

   Principe de sécurité : si Motion ne se charge pas (pas d'internet, CDN en
   panne…) ou si le visiteur préfère moins d'animations, ce fichier ne fait
   RIEN. Le site s'affiche alors normalement, sans animation. Rien n'est
   jamais caché dans le CSS : c'est ce fichier qui cache puis révèle.
   ========================================================================== */


/* --------------------------------------------------------------------------
   1. VÉRIFICATIONS DE DÉPART
   -------------------------------------------------------------------------- */

// Le visiteur a-t-il activé « réduire les animations » dans les réglages
// de son téléphone ou de son ordinateur ? (true = oui)
const reduireAnimations = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// La bibliothèque Motion est-elle bien chargée ?
const motionDisponible = typeof window.Motion !== "undefined";

if (motionDisponible && !reduireAnimations) {
  // On « déballe » les 4 outils de Motion pour les écrire plus court
  const { animate, inView, hover, stagger } = Motion;


  /* ------------------------------------------------------------------------
     2. APPARITION DOUCE DES SECTIONS AU DÉFILEMENT
     Chaque élément choisi part légèrement transparent et 24 px plus bas,
     puis remonte en devenant visible quand il arrive à l'écran.
     ------------------------------------------------------------------------ */

  // Réglages communs à toutes les apparitions (modifiez-les ici)
  const DEPLACEMENT = 24;     // en pixels : de combien l'élément remonte
  const DUREE = 0.6;          // en secondes
  const COURBE = [0.22, 1, 0.36, 1]; // « courbe de vitesse » : rapide au début, très douce à la fin

  // Prépare un élément : invisible et un peu plus bas (état de départ)
  function preparer(element) {
    element.style.opacity = "0";
    element.style.transform = `translateY(${DEPLACEMENT}px)`;
  }

  // Une fois l'animation finie, on efface les styles ajoutés par Motion.
  // Important : sinon ils bloqueraient les effets de survol écrits dans le CSS.
  function nettoyer(elements) {
    elements.forEach(function (element) {
      element.style.opacity = "";
      element.style.transform = "";
    });
  }

  // a) Éléments isolés : titres de section, blocs photo + texte, bandeaux…
  //    (le grand bandeau photo de l'accueil n'est pas animé : il est déjà
  //    à l'écran à l'arrivée sur la page)
  const elementsSeuls = document.querySelectorAll(
    ".section-entete, .duo > *, .pastilles, .section-pied, .appel .conteneur, .contact-grille > *"
  );
  elementsSeuls.forEach(preparer);

  inView(elementsSeuls, function (element) {
    animate(
      element,
      { opacity: 1, transform: "translateY(0px)" },
      { duration: DUREE, ease: COURBE }
    ).then(function () {
      nettoyer([element]);
    });
  }, { amount: 0.2 }); // se déclenche quand 20 % de l'élément est visible

  // b) Groupes de cartes : les cartes d'une même grille apparaissent
  //    en cascade (0,08 s d'écart entre chacune) grâce à stagger().
  const groupes = document.querySelectorAll(".grille, .etapes, .atouts-liste");
  groupes.forEach(function (groupe) {
    Array.from(groupe.children).forEach(preparer);
  });

  inView(groupes, function (groupe) {
    const cartes = Array.from(groupe.children);
    animate(
      cartes,
      { opacity: 1, transform: "translateY(0px)" },
      { duration: DUREE, ease: COURBE, delay: stagger(0.08) }
    ).then(function () {
      nettoyer(cartes);
    });
  }, { amount: 0.1 });


  /* ------------------------------------------------------------------------
     3. EFFET AU SURVOL DES CARTES DE PACKS (page Packs)
     Au passage de la souris : la carte se soulève de 6 px, son ombre
     s'agrandit et la photo zoome très légèrement (3 %).
     Motion ignore automatiquement les « faux survols » des écrans tactiles :
     sur téléphone, rien ne se passe.
     ------------------------------------------------------------------------ */
  hover(".pack", function (carte) {
    const photo = carte.querySelector("img");

    // Ce qui se passe quand la souris ARRIVE sur la carte
    // (on écrit le déplacement avec "transform", comme pour l'apparition :
    //  mélanger deux écritures différentes perturbe Motion)
    animate(carte, { transform: "translateY(-6px)", boxShadow: "0 18px 40px rgba(42, 38, 34, 0.16)" }, { duration: 0.3 });
    if (photo) animate(photo, { scale: 1.03 }, { duration: 0.4 });

    // La fonction renvoyée ici est appelée quand la souris QUITTE la carte :
    // on revient à l'état normal (l'ombre d'origine vient de --ombre, section 1 du CSS)
    return function () {
      animate(carte, { transform: "translateY(0px)", boxShadow: "0 10px 30px rgba(42, 38, 34, 0.08)" }, { duration: 0.25 });
      if (photo) animate(photo, { scale: 1 }, { duration: 0.3 });
    };
  });
}
