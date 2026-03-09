# ESPRIT Design System

## 🎨 Palette de Couleurs

### Couleurs Principales
- **Noir** (`#000000`): Texte, logo, éléments principaux
- **Blanc** (`#ffffff`): Fond, cartes, espaces vides
- **Rouge** (`#DC143C`): Accent, boutons, mise en avant

### Couleurs Secondaires
- **Gris Clair** (`#f5f5f5`): Fonds légers
- **Gris Moyen** (`#666666`): Texte secondaire
- **Gris Foncé** (`#333333`): Bordures

## 🏗️ Composants

### Boutons (Tailwind Classes)

#### Bouton Principal (Rouge)
```tsx
className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg hover:shadow-red-600/30 transition-all"
```

#### Bouton Secondaire (Noir)
```tsx
className="bg-black hover:bg-gray-900 text-white font-bold rounded-lg shadow-lg transition-all"
```

#### Bouton Outline (Noir/Blanc)
```tsx
className="border-2 border-black bg-white text-black hover:bg-black hover:text-white font-bold rounded-lg transition-all"
```

### Cartes (Cards)
```tsx
className="bg-white rounded-2xl shadow-xl hover:shadow-2xl p-8 border border-gray-200 transition-all"
```

### Entrées de Formulaire
```tsx
className="bg-white border-2 border-gray-200 focus:border-red-600 focus:ring-red-600 rounded-lg h-10 text-black font-medium"
```

## 📐 Typographie

### Tailles de Police
- **H1**: `text-4xl md:text-7xl font-bold text-black`
- **H2**: `text-3xl font-bold text-black`
- **H3**: `text-xl font-bold text-black`
- **Body**: `text-base font-medium text-gray-700`
- **Small**: `text-sm font-medium text-gray-600`

## 🎯 Composants Modifiés

### 1. Sidebar
- Fond noir pur (`bg-black`)
- Bordure rouge (`border-red-600`)
- Logo avec fond rouge en hover
- Items actifs avec fond rouge
- Texte blanc avec accents rouges

### 2. Formulaires (Login/Register)
- En-tête noir avec bordure basse rouge
- Champs d'entrée blancs avec bordures grises
- Focus rouge
- Boutons rouges avec ombre
- Messages d'erreur en rouge

### 3. Page d'Accueil
- Fond blanc/gris dégradé
- Chef blanc avec bordure inférieure rouge
- Cartes blanches avec bordure gauche rouge
- CTA noir avec bordure rouge
- Footer noir avec texte gris

### 4. Dashboard
- Cartes de statistiques avec bordure gauche rouge
- Tendances en vert/rouge selon la direction
- Ombres douces et transitions douces

## ✨ Animations

### Transitions
- Durée standard: `duration-200`
- Durée longue: `duration-300`
- Easing: `ease-in-out`

### Animations Clés
```css
@keyframes slideInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

## 🔧 Variables CSS

```css
:root {
  --primary: #000000;
  --primary-foreground: #ffffff;
  --accent: #DC143C;
  --accent-foreground: #ffffff;
  --background: #ffffff;
  --foreground: #000000;
}
```

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: `sm:`, `md:`, `lg:`, `xl:`
- Flexbox et Grid pour les layouts

## 🎓 Marque ESPRIT

### Logo
- Utilisé: `esprit-logo.svg`
- Logo "E" carré noir avec hover rouge
- Subtexte: "Se former autrement"

### Slogan
"Se former autrement" - intégré partout dans l'UI

## 📝 Règles d'Application

1. Tous les boutons d'action primaires sont rouges
2. Le texte principal est noir
3. Les fonds sont blancs ou gris très clair
4. Les bordures mettent à jour sont rouges
5. Les ombres sont subtiles et grises
6. Les transitions sont douces (200-300ms)
7. Les coins sont arrondis (`rounded-lg` pour les boutons, `rounded-2xl` pour les cartes)

## 🎨 Exemples d'Utilisation

### Button Principal
```tsx
<Button className="bg-red-600 hover:bg-red-700 text-white font-bold">
  Action
</Button>
```

### Card Moderne
```tsx
<div className="bg-white rounded-2xl p-8 shadow-xl border-l-4 border-red-600">
  Contenu
</div>
```

### Form Input
```tsx
<Input 
  className="border-2 border-gray-200 focus:border-red-600 rounded-lg"
  placeholder="Entrez..." 
/>
```
