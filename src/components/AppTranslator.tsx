"use client";

import { useEffect } from "react";
import { useLanguage } from "./LanguageProvider";

const FRENCH: Record<string, string> = {
  "Choose language": "Choisir la langue",
  "Restaurants near you": "Restaurants près de chez vous",
  "Choose a restaurant": "Choisissez un restaurant",
  "Browse local restaurants, then open a restaurant to explore its complete menu and customize your order.": "Parcourez les restaurants locaux, puis consultez leur menu complet et personnalisez votre commande.",
  "All restaurants": "Tous les restaurants",
  "All highlights": "Toutes les sélections",
  "All cuisines": "Toutes les cuisines",
  "Display closed restaurants": "Afficher les restaurants fermés",
  "Finding restaurants…": "Recherche de restaurants…",
  "Select a card to view its menu": "Sélectionnez une carte pour voir son menu",
  "No restaurants found": "Aucun restaurant trouvé",
  "Try changing your search or filters.": "Essayez de modifier votre recherche ou vos filtres.",
  "Show all restaurants": "Afficher tous les restaurants",
  "Home": "Accueil",
  "Dashboard": "Tableau de bord",
  "Orders": "Commandes",
  "Order": "Commande",
  "My orders": "Mes commandes",
  "Restaurant": "Restaurant",
  "Restaurants": "Restaurants",
  "Menu": "Menu",
  "Discounts": "Réductions",
  "Reviews": "Avis",
  "Ranking": "Classement",
  "Sales": "Ventes",
  "Profile": "Profil",
  "Account": "Compte",
  "Settings": "Paramètres",
  "Cart": "Panier",
  "Your cart": "Votre panier",
  "Checkout": "Paiement",
  "Payment": "Paiement",
  "Delivery": "Livraison",
  "Pickup": "À emporter",
  "Delivery address": "Adresse de livraison",
  "Address": "Adresse",
  "City": "Ville",
  "Postal code": "Code postal",
  "Phone": "Téléphone",
  "Email": "E-mail",
  "Password": "Mot de passe",
  "First name": "Prénom",
  "Last name": "Nom",
  "Name": "Nom",
  "Description": "Description",
  "Category": "Catégorie",
  "Price": "Prix",
  "Quantity": "Quantité",
  "Subtotal": "Sous-total",
  "Total": "Total",
  "Tip": "Pourboire",
  "Status": "Statut",
  "Date": "Date",
  "Time": "Heure",
  "Open": "Ouvert",
  "Closed": "Fermé",
  "Available": "Disponible",
  "Unavailable": "Indisponible",
  "Active": "Actif",
  "Inactive": "Inactif",
  "Pending": "En attente",
  "Accepted": "Acceptée",
  "Preparing": "En préparation",
  "Ready": "Prête",
  "Delivered": "Livrée",
  "Cancelled": "Annulée",
  "Search": "Rechercher",
  "Search restaurants": "Rechercher des restaurants",
  "Filter": "Filtrer",
  "Sort by": "Trier par",
  "View details": "Voir les détails",
  "Details": "Détails",
  "See all": "Voir tout",
  "Learn more": "En savoir plus",
  "Back": "Retour",
  "Continue": "Continuer",
  "Next": "Suivant",
  "Previous": "Précédent",
  "Close": "Fermer",
  "Cancel": "Annuler",
  "Confirm": "Confirmer",
  "Save": "Enregistrer",
  "Save changes": "Enregistrer les modifications",
  "Edit": "Modifier",
  "Delete": "Supprimer",
  "Add": "Ajouter",
  "Update": "Mettre à jour",
  "Submit": "Envoyer",
  "Apply": "Appliquer",
  "Remove": "Retirer",
  "Create account": "Créer un compte",
  "Create an account": "Créer un compte",
  "Sign in": "Connexion",
  "Sign up": "S’inscrire",
  "Sign out": "Déconnexion",
  "Log in": "Se connecter",
  "Forgot password?": "Mot de passe oublié ?",
  "Reset password": "Réinitialiser le mot de passe",
  "Welcome back": "Bon retour",
  "Loading...": "Chargement…",
  "No results found": "Aucun résultat trouvé",
  "No orders found": "Aucune commande trouvée",
  "Add to cart": "Ajouter au panier",
  "Go to cart": "Voir le panier",
  "Place order": "Passer la commande",
  "Order now": "Commander maintenant",
  "Order details": "Détails de la commande",
  "Order history": "Historique des commandes",
  "Track order": "Suivre la commande",
  "Payment method": "Mode de paiement",
  "Pay now": "Payer maintenant",
  "Cash on delivery": "Paiement à la livraison",
  "Credit card": "Carte bancaire",
  "Free delivery": "Livraison gratuite",
  "Delivery fee": "Frais de livraison",
  "Estimated delivery": "Livraison estimée",
  "Special instructions": "Instructions spéciales",
  "Popular": "Populaire",
  "Featured": "À la une",
  "New": "Nouveau",
  "All": "Tout",
  "Today": "Aujourd’hui",
  "This week": "Cette semaine",
  "This month": "Ce mois-ci",
  "Customer": "Client",
  "Customers": "Clients",
  "Items": "Articles",
  "Item": "Article",
  "Manage menu": "Gérer le menu",
  "Add item": "Ajouter un article",
  "Add menu item": "Ajouter un plat",
  "Restaurant settings": "Paramètres du restaurant",
  "Customer reviews": "Avis clients",
  "No-waste offers": "Offres anti-gaspillage",
  "Terms": "Conditions",
  "Privacy": "Confidentialité",
  "Terms and Conditions": "Conditions générales",
  "Privacy Policy": "Politique de confidentialité",
};

const originalText = new WeakMap<Text, string>();
const translatedAttributes = ["placeholder", "title", "aria-label"] as const;

const PHRASES: Array<[RegExp, string]> = [
  [/\badd to cart\b/gi, "ajouter au panier"],
  [/\bcreate an account\b/gi, "créer un compte"],
  [/\bcreate account\b/gi, "créer un compte"],
  [/\bsign out\b/gi, "se déconnecter"],
  [/\bsign in\b/gi, "se connecter"],
  [/\blog in\b/gi, "se connecter"],
  [/\bdelivery address\b/gi, "adresse de livraison"],
  [/\bdelivery fee\b/gi, "frais de livraison"],
  [/\bpayment method\b/gi, "mode de paiement"],
  [/\border details\b/gi, "détails de la commande"],
  [/\brestaurant settings\b/gi, "paramètres du restaurant"],
  [/\bcustomer reviews\b/gi, "avis clients"],
  [/\bno results found\b/gi, "aucun résultat trouvé"],
  [/\bno orders found\b/gi, "aucune commande trouvée"],
  [/\bforgot password\b/gi, "mot de passe oublié"],
  [/\breset password\b/gi, "réinitialiser le mot de passe"],
  [/\bsave changes\b/gi, "enregistrer les modifications"],
  [/\blearn more\b/gi, "en savoir plus"],
  [/\bview details\b/gi, "voir les détails"],
  [/\bsee all\b/gi, "voir tout"],
];

const WORDS: Record<string, string> = {
  add: "ajouter", address: "adresse", all: "tout", allergies: "allergies",
  available: "disponible", back: "retour", cancel: "annuler", cart: "panier",
  category: "catégorie", checkout: "paiement", city: "ville", close: "fermer",
  confirm: "confirmer", continue: "continuer", customer: "client", customers: "clients",
  dashboard: "tableau de bord", date: "date", delete: "supprimer", delivered: "livrée",
  delivery: "livraison", description: "description", details: "détails", discount: "réduction",
  discounts: "réductions", edit: "modifier", email: "e-mail", featured: "à la une",
  filter: "filtrer", home: "accueil", item: "article", items: "articles", loading: "chargement",
  menu: "menu", name: "nom", new: "nouveau", next: "suivant", open: "ouvert",
  order: "commande", orders: "commandes", password: "mot de passe", payment: "paiement",
  pending: "en attente", phone: "téléphone", pickup: "à emporter", popular: "populaire",
  previous: "précédent", price: "prix", profile: "profil", quantity: "quantité",
  ranking: "classement", restaurant: "restaurant", restaurants: "restaurants",
  reviews: "avis", sales: "ventes", save: "enregistrer", search: "rechercher",
  settings: "paramètres", status: "statut", subtotal: "sous-total", submit: "envoyer",
  time: "heure", tip: "pourboire", today: "aujourd’hui", total: "total",
  unavailable: "indisponible", update: "mettre à jour", welcome: "bienvenue",
  your: "votre",
};

function translated(value: string) {
  const trimmed = value.trim();
  const result = FRENCH[trimmed];
  if (result) return value.replace(trimmed, result);

  let next = value;
  for (const [pattern, replacement] of PHRASES) next = next.replace(pattern, replacement);
  next = next.replace(/\b[A-Za-z]+\b/g, (word) => {
    const replacement = WORDS[word.toLowerCase()];
    if (!replacement) return word;
    return /^[A-Z]/.test(word)
      ? replacement.charAt(0).toUpperCase() + replacement.slice(1)
      : replacement;
  });
  return next;
}

export default function AppTranslator() {
  const { language } = useLanguage();

  useEffect(() => {
    const translateRoot = (root: Node) => {
      const nodes: Text[] = [];
      if (root.nodeType === Node.TEXT_NODE) nodes.push(root as Text);
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let current: Node | null;
      while ((current = walker.nextNode())) nodes.push(current as Text);

      for (const node of nodes) {
        const parent = node.parentElement;
        if (!parent || ["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName)) continue;
        if (!originalText.has(node)) originalText.set(node, node.nodeValue ?? "");
        const source = originalText.get(node) ?? "";
        const next = language === "fr" ? translated(source) : source;
        if (node.nodeValue !== next) node.nodeValue = next;
      }

      const elements = root.nodeType === Node.ELEMENT_NODE
        ? [root as Element, ...(root as Element).querySelectorAll("*")]
        : [];
      for (const element of elements) {
        for (const attribute of translatedAttributes) {
          const value = element.getAttribute(attribute);
          if (!value) continue;
          const dataKey = `languageOriginal${attribute.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase()).replace(/^./, (letter) => letter.toUpperCase())}`;
          const htmlElement = element as HTMLElement;
          if (!htmlElement.dataset[dataKey]) htmlElement.dataset[dataKey] = value;
          const source = htmlElement.dataset[dataKey] ?? value;
          const next = language === "fr" ? translated(source) : source;
          if (value !== next) element.setAttribute(attribute, next);
        }
      }
    };

    translateRoot(document.body);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) translateRoot(node);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);

  return null;
}
