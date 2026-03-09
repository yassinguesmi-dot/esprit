import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EspritLogo } from '@/components/EspritLogo';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-[#050505] dark:via-[#0f1115] dark:to-[#151821]">
      {/* Navigation */}
      <nav className="border-b-2 border-red-600 bg-white shadow-sm sticky top-0 z-40 dark:bg-[#0f1115] dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <EspritLogo compact className="hover:opacity-90" />
          <div className="flex gap-3 items-center">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="outline">
                Connexion
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-red-600 hover:bg-red-700 text-white px-5 py-2">
                S'inscrire
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="inline-block mb-6 px-4 py-2 bg-red-100 border border-red-300 rounded-full">
          <p className="text-red-700 font-bold text-sm">🎓 Bienvenue à ESPRIT</p>
        </div>
        <h2 className="text-6xl md:text-7xl font-bold text-black dark:text-white mb-6">
          Plateforme de Suivi <br /> des Activités Académiques
        </h2>
        <p className="text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed font-medium">
          Une solution intégrée pour déclarer vos activités, générer des rapports automatiques et faciliter la gestion de vos responsabilités académiques.
        </p>

        <div className="flex gap-4 justify-center mb-16">
          <Link href="/register">
            <Button className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-lg font-bold shadow-lg hover:shadow-red-600/30">
              Commencer Maintenant
            </Button>
          </Link>
          <Button
            variant="outline"
            className="px-8 py-4 text-lg font-bold"
            disabled
          >
            En savoir plus
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white dark:bg-[#0f1115] rounded-2xl p-8 shadow-xl hover:shadow-2xl transition border border-border border-l-4 border-l-red-600">
            <div className="text-5xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-black dark:text-white mb-2">
              Déclaration d'Activités
            </h3>
            <p className="text-gray-600 dark:text-gray-300 font-medium">
              Déclarez facilement vos activités d'enseignement, recherche et responsabilités académiques.
            </p>
          </div>

          <div className="bg-white dark:bg-[#0f1115] rounded-2xl p-8 shadow-xl hover:shadow-2xl transition border border-border border-l-4 border-l-red-600">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-black dark:text-white mb-2">
              Génération de Rapports
            </h3>
            <p className="text-gray-600 dark:text-gray-300 font-medium">
              Générez automatiquement des rapports PDF professionnels de vos activités annuelles.
            </p>
          </div>

          <div className="bg-white dark:bg-[#0f1115] rounded-2xl p-8 shadow-xl hover:shadow-2xl transition border border-border border-l-4 border-l-red-600">
            <div className="text-5xl mb-4">✓</div>
            <h3 className="text-xl font-bold text-black dark:text-white mb-2">
              Workflow de Validation
            </h3>
            <p className="text-gray-600 dark:text-gray-300 font-medium">
              Processus de validation hiérarchique pour assurer la conformité et la traçabilité.
            </p>
          </div>

          <div className="bg-white dark:bg-[#0f1115] rounded-2xl p-8 shadow-xl hover:shadow-2xl transition border border-border border-l-4 border-l-red-600">
            <div className="text-5xl mb-4">💰</div>
            <h3 className="text-xl font-bold text-black dark:text-white mb-2">
              Calcul de Primes
            </h3>
            <p className="text-gray-600 dark:text-gray-300 font-medium">
              Suivi automatisé des primes basé sur les performances et les activités déclarées.
            </p>
          </div>

          <div className="bg-white dark:bg-[#0f1115] rounded-2xl p-8 shadow-xl hover:shadow-2xl transition border border-border border-l-4 border-l-red-600">
            <div className="text-5xl mb-4">📈</div>
            <h3 className="text-xl font-bold text-black dark:text-white mb-2">
              Tableaux de Bord
            </h3>
            <p className="text-gray-600 dark:text-gray-300 font-medium">
              Visualisez vos performances avec des indicateurs clés et des statistiques détaillées.
            </p>
          </div>

          <div className="bg-white dark:bg-[#0f1115] rounded-2xl p-8 shadow-xl hover:shadow-2xl transition border border-border border-l-4 border-l-red-600">
            <div className="text-5xl mb-4">🔒</div>
            <h3 className="text-xl font-bold text-black dark:text-white mb-2">
              Sécurité
            </h3>
            <p className="text-gray-600 dark:text-gray-300 font-medium">
              Authentification sécurisée et gestion des permissions pour protéger vos données.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 bg-gradient-to-r from-black to-gray-900 dark:from-[#111111] dark:to-[#1d2430] rounded-2xl p-12 shadow-2xl border-2 border-red-600">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à Commencer?
          </h2>
          <p className="text-gray-300 mb-8 font-medium text-lg">
            Créez votre compte et commencez à gérer vos activités académiques dès aujourd'hui.
          </p>
          <Link href="/register">
            <Button className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-lg font-bold shadow-lg hover:shadow-red-600/30">
              Créer un Compte
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-red-600 bg-black mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-white mb-2 text-lg">ESPRIT</h3>
              <p className="text-red-600 text-sm font-semibold mb-3">Se former autrement</p>
              <p className="text-gray-400 text-sm">
                Plateforme de suivi des activités académiques
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Produit</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition">Fonctionnalités</a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">Tarification</a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition">Documentation</a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">Contact</a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Légal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition">Confidentialité</a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">Conditions</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            <p>© 2024 ESPRIT - Honoris United Universities. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
