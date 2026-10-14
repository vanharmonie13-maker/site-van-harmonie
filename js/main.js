/* ==========================================================================
   VAN HARMONIE — Script principal
   --------------------------------------------------------------------------
   Ce fichier est chargé par les 4 pages (balise <script> en bas du HTML).
   Il ajoute un peu d'interactivité :
     1. Ouvrir / fermer le menu sur mobile
     2. Afficher l'année en cours dans le pied de page
     3. Comparateur avant / après (page Réalisations)
     4. Filtres des réalisations (page Réalisations)
     5. Pré-cocher un pack dans le formulaire (page Contact)
     6. Formulaire de devis : vérification des champs + message (page Contact)

   Chaque partie vérifie d'abord que les éléments existent sur la page :
   si on n'est pas sur la bonne page, elle ne fait simplement rien.
   ========================================================================== */


/* --------------------------------------------------------------------------
   1. MENU MOBILE
   Au clic sur le bouton « burger », on ajoute ou retire la classe "ouvert"
   sur le menu. Le CSS s'occupe de l'afficher ou de le cacher.
   -------------------------------------------------------------------------- */
const boutonMenu = document.querySelector(".menu-bouton");
const menu = document.querySelector(".menu");

if (boutonMenu && menu) {
  boutonMenu.addEventListener("click", function () {
    // toggle() ajoute la classe si elle n'y est pas, l'enlève sinon.
    // Il renvoie true si le menu vient d'être ouvert.
    const estOuvert = menu.classList.toggle("ouvert");

    // aria-expanded indique aux lecteurs d'écran si le menu est ouvert
    boutonMenu.setAttribute("aria-expanded", estOuvert);
    boutonMenu.querySelector(".visuellement-cache").textContent =
      estOuvert ? "Fermer le menu" : "Ouvrir le menu";
  });
}


/* --------------------------------------------------------------------------
   2. ANNÉE AUTOMATIQUE DANS LE PIED DE PAGE
   Remplace le contenu de chaque élément ayant la classe "annee" par l'année
   actuelle : plus besoin de modifier le « © 2026 » chaque 1er janvier.
   -------------------------------------------------------------------------- */
document.querySelectorAll(".annee").forEach(function (element) {
  element.textContent = new Date().getFullYear();
});


/* --------------------------------------------------------------------------
   3. COMPARATEUR AVANT / APRÈS
   Chaque bloc .avant-apres contient un curseur invisible (input range,
   de 0 à 100). Quand on le déplace, on met à jour la variable CSS
   --position, qui décide quelle portion de la photo « après » est visible.
   -------------------------------------------------------------------------- */
document.querySelectorAll(".avant-apres").forEach(function (bloc) {
  const curseur = bloc.querySelector('input[type="range"]');
  if (!curseur) return;

  curseur.addEventListener("input", function () {
    bloc.style.setProperty("--position", curseur.value + "%");
  });
});


/* --------------------------------------------------------------------------
   4. FILTRES DES RÉALISATIONS
   Chaque bouton de filtre a un attribut data-filtre ("tous", "modulaire",
   "complet"). Chaque réalisation a un attribut data-categorie.
   On cache les réalisations qui ne correspondent pas au filtre choisi.
   -------------------------------------------------------------------------- */
const boutonsFiltre = document.querySelectorAll(".filtre");
const realisations = document.querySelectorAll(".realisation");

boutonsFiltre.forEach(function (bouton) {
  bouton.addEventListener("click", function () {
    const filtreChoisi = bouton.dataset.filtre;

    // Met à jour l'état visuel des boutons (un seul actif à la fois)
    boutonsFiltre.forEach(function (autreBouton) {
      autreBouton.setAttribute("aria-pressed", autreBouton === bouton);
    });

    // Affiche ou cache chaque réalisation
    realisations.forEach(function (carte) {
      const correspond =
        filtreChoisi === "tous" || carte.dataset.categorie === filtreChoisi;
      carte.hidden = !correspond;
    });
  });
});


/* --------------------------------------------------------------------------
   5. PRÉ-COCHER UN PACK DANS LE FORMULAIRE
   Sur la page Packs, les boutons « Demander un devis » mènent par exemple à
   contact.html?pack=energie. Ici, on lit ce "?pack=..." dans l'adresse et
   on coche automatiquement la case correspondante du formulaire.
   -------------------------------------------------------------------------- */
const packDemande = new URLSearchParams(window.location.search).get("pack");

if (packDemande) {
  document
    .querySelectorAll('input[name="prestations"]')
    .forEach(function (caseACocher) {
      if (caseACocher.value === packDemande) {
        caseACocher.checked = true;
      }
    });
}


/* --------------------------------------------------------------------------
   6. FORMULAIRE DE DEVIS : VÉRIFICATION DES CHAMPS + MESSAGE DE DÉMONSTRATION

   Quand un champ est mal rempli :
     - son cadre devient rouge et un message clair s'affiche JUSTE DESSOUS ;
     - au clic sur « Envoyer », un récapitulatif apparaît en haut du
       formulaire, avec un lien vers chaque champ à corriger ;
     - dès que le champ est corrigé, le message disparaît tout seul.

   Quand vérifie-t-on un champ ?
     - en le QUITTANT (pas pendant la frappe : ce serait agaçant), mais
       seulement s'il contient quelque chose ou si on a déjà cliqué « Envoyer » ;
     - PENDANT la frappe uniquement s'il est déjà en erreur, pour retirer le
       message dès que c'est bon.

   Le formulaire n'est pas encore relié à une messagerie : quand tout est
   correct, on affiche seulement un message de démonstration.

   👉 Pour le brancher plus tard, la solution la plus simple est un service
   comme Formspree ou Web3Forms (leur documentation explique comment envoyer
   le formulaire depuis le JavaScript, à la place du message de
   démonstration tout en bas de cette section).
   -------------------------------------------------------------------------- */
const formulaire = document.querySelector("#formulaire-devis");
const messageEnvoi = document.querySelector("#message-envoi");
const resumeErreurs = document.querySelector("#erreurs-resume");
const listeErreurs = document.querySelector("#erreurs-liste");

// Les textes des messages, champ par champ. ✏️ Modifiez-les librement ici.
//   libelle : nom du champ affiché dans le récapitulatif
//   vide    : message si le champ obligatoire est vide
//   format  : message si le contenu n'a pas le bon format (email, téléphone)
// Chaque nom (nom, email…) correspond à l'attribut name="..." du champ HTML.
const MESSAGES = {
  nom: {
    libelle: "Nom",
    vide: "Indiquez votre nom."
  },
  email: {
    libelle: "Email",
    vide: "Indiquez votre adresse email.",
    format: "Cette adresse email semble incomplète (exemple : prenom@gmail.com)."
  },
  telephone: {
    libelle: "Téléphone",
    format: "Ce numéro ne semble pas valide (exemple : 06 12 34 56 78)."
  },
  localisation: {
    libelle: "Localisation",
    vide: "Indiquez votre ville ou votre code postal."
  },
  vehicule: {
    libelle: "Véhicule",
    vide: "Indiquez votre véhicule (la marque et le modèle suffisent)."
  },
  besoin: {
    libelle: "Votre besoin",
    vide: "Décrivez votre besoin en quelques mots."
  },
  echeance: {
    libelle: "Échéance",
    vide: "Choisissez une échéance (« Pas de date précise » si vous ne savez pas encore)."
  },
  consentement: {
    libelle: "Consentement",
    vide: "Cochez cette case pour que nous puissions vous recontacter."
  }
};

if (formulaire && messageEnvoi && resumeErreurs && listeErreurs) {

  // On désactive les petites bulles d'erreur du navigateur : c'est notre
  // code qui s'en charge. (Si le JavaScript ne marchait pas, cette ligne ne
  // s'exécuterait pas et les bulles du navigateur reprendraient le relais.)
  formulaire.noValidate = true;

  // Devient vrai au premier clic sur « Envoyer »
  let envoiTente = false;

  // La liste des champs à vérifier (ceux qui ont des messages ci-dessus)
  const champsVerifies = Object.keys(MESSAGES)
    .map(function (nom) { return formulaire.elements[nom]; })
    .filter(Boolean);

  // Renvoie le message d'erreur d'un champ, ou "" (texte vide) s'il est correct.
  // "champ.validity" est fourni par le navigateur : il sait déjà si un champ
  // obligatoire est vide (valueMissing) ou si un email est mal formé.
  function trouverErreur(champ) {
    const textes = MESSAGES[champ.name];

    // Un champ rempli uniquement d'espaces compte comme vide
    if (champ.required && champ.type !== "checkbox" && champ.value.trim() === "") {
      return textes.vide;
    }
    if (champ.validity.valid) return "";
    if (champ.validity.valueMissing) return textes.vide;
    return textes.format || textes.vide;
  }

  // Ajoute (ou retire) l'identifiant du message dans aria-describedby :
  // c'est ce qui permet aux lecteurs d'écran de lire l'erreur avec le champ.
  function relierMessage(champ, idMessage, relier) {
    const ids = (champ.getAttribute("aria-describedby") || "")
      .split(" ")
      .filter(function (id) { return id && id !== idMessage; });
    if (relier) ids.unshift(idMessage);
    if (ids.length > 0) {
      champ.setAttribute("aria-describedby", ids.join(" "));
    } else {
      champ.removeAttribute("aria-describedby");
    }
  }

  // Vérifie un champ, puis affiche ou efface son message.
  function verifierChamp(champ) {
    const message = trouverErreur(champ);
    const zone = document.getElementById("erreur-" + champ.name);

    zone.textContent = message;
    zone.hidden = message === "";
    if (message) {
      champ.setAttribute("aria-invalid", "true"); // le CSS le colore en rouge
    } else {
      champ.removeAttribute("aria-invalid");
    }
    relierMessage(champ, zone.id, message !== "");
  }

  // Reconstruit le récapitulatif en haut du formulaire.
  // Renvoie le nombre d'erreurs.
  function mettreAJourResume() {
    const champsEnErreur = champsVerifies.filter(function (champ) {
      return champ.getAttribute("aria-invalid") === "true";
    });

    listeErreurs.textContent = ""; // vide la liste précédente

    champsEnErreur.forEach(function (champ) {
      const lien = document.createElement("a");
      lien.href = "#" + champ.id;
      lien.textContent =
        MESSAGES[champ.name].libelle + " : " +
        document.getElementById("erreur-" + champ.name).textContent;

      // Au clic : on place le curseur directement dans le champ concerné
      lien.addEventListener("click", function (evenement) {
        evenement.preventDefault();
        champ.focus();
      });

      const ligne = document.createElement("li");
      ligne.appendChild(lien);
      listeErreurs.appendChild(ligne);
    });

    resumeErreurs.hidden = champsEnErreur.length === 0;
    return champsEnErreur.length;
  }

  // On branche les vérifications sur chaque champ
  champsVerifies.forEach(function (champ) {
    const estCaseOuListe = champ.type === "checkbox" || champ.tagName === "SELECT";

    // Cases à cocher et listes déroulantes : vérifiées dès qu'on les change
    // (si on a déjà essayé d'envoyer, ou si elles étaient en erreur)
    if (estCaseOuListe) {
      champ.addEventListener("change", function () {
        if (envoiTente || champ.getAttribute("aria-invalid") === "true") {
          verifierChamp(champ);
          if (envoiTente) mettreAJourResume();
        }
      });
      return;
    }

    // Champs texte : vérifiés en les QUITTANT…
    champ.addEventListener("blur", function () {
      if (envoiTente || champ.value.trim() !== "") {
        verifierChamp(champ);
        if (envoiTente) mettreAJourResume();
      }
    });

    // …et pendant la frappe seulement s'ils sont déjà en erreur
    champ.addEventListener("input", function () {
      if (champ.getAttribute("aria-invalid") === "true") {
        verifierChamp(champ);
        if (envoiTente) mettreAJourResume();
      }
    });
  });

  // Au clic sur « Envoyer »
  formulaire.addEventListener("submit", function (evenement) {
    evenement.preventDefault(); // empêche le rechargement de la page
    envoiTente = true;

    champsVerifies.forEach(verifierChamp);
    const nombreErreurs = mettreAJourResume();

    if (nombreErreurs > 0) {
      // Des erreurs : on cache l'éventuel message de succès et on place le
      // curseur sur le récapitulatif (la page y défile, et les lecteurs
      // d'écran lisent la liste des erreurs).
      messageEnvoi.hidden = true;
      resumeErreurs.focus();
      return;
    }

    // Tout est correct : message de démonstration
    messageEnvoi.hidden = false;
    messageEnvoi.textContent =
      "Merci ! (Version de démonstration : le formulaire n'est pas encore " +
      "relié à une messagerie, aucune donnée n'a été envoyée.)";

    // Fait défiler la page jusqu'au message pour qu'il soit bien vu
    messageEnvoi.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}
