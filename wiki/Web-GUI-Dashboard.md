# Dashboard Web & Monitoring en Temps Réel

> 🤖 **Avertissement / AI Transparency & Disclosure** : Document d'architecture généré avec l'assistance d'une Intelligence Artificielle (Google Antigravity / Gemini 3.8 Flash & LM Studio).

Le mode Daemon de **LM Studio MCP Connector v2.0** intègre un serveur Web complet et une Single-Page Application (SPA) responsive servie directement en natif Node.js (zéro framework lourd, zéro dépendance externe).

---

## 🚀 Démarrer le Daemon avec la GUI Web

```bash
# Lancement sur le port 9123 (par défaut) :
node dist/index.js --daemon

# Lancement sur un port personnalisé avec plusieurs machines :
node dist/index.js --daemon --port 9123 --instances "http://127.0.0.1:1234,http://192.168.0.108:1234,http://192.168.0.43:1234"
```

Accédez ensuite à l'interface dans votre navigateur :
👉 **`http://127.0.0.1:9123/`**

---

## 🖥️ Fonctionnalités du Dashboard

```text
┌────────────────────────────────────────────────────────────────────────┐
│  LM Studio MCP Connector [ ONLINE ]       [ ⚡ Healthcheck Rapide ]   │
│  Multi-Instance Load Balancer, Circuit Breaker & Fallback Controller  │
├────────────────────────────────────────────────────────────────────────┤
│  [ 3 / 3 ]           [ 0 ]              [ 42 ]             [ 0 ]       │
│  Inst. Actives    Requêtes en vol    Requêtes OK        Échecs/Bascule │
├────────────────────────────────────────────────────────────────────────┤
│  Instances LM Studio Configurées                                       │
│  ┌───────────────────────┐ ┌───────────────────────┐                  │
│  │ instance-1 [ONLINE]   │ │ gpu-02 [ONLINE]       │                  │
│  │ http://127.0.0.1:1234 │ │ 192.168.0.108:1234    │                  │
│  │ Rôles: all            │ │ Rôles: all            │                  │
│  │ Latence: 3ms          │ │ Latence: 4ms          │                  │
│  │ Modèles: gemma-4-e4b  │ │ Modèles: gemma-4-e4b  │                  │
│  │ [Tester]  [Supprimer] │ │ [Tester]  [Supprimer] │                  │
│  └───────────────────────┘ └───────────────────────┘                  │
├────────────────────────────────────────────────────────────────────────┤
│  Ajouter une Nouvelle Instance                                         │
│  [ ID: gpu-04 ] [ URL: http://192.168.0.50:1234 ] [ Rôle: chat ]       │
│  [ ＋ Ajouter l'Instance au Pool ]                                     │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Métriques Globales en Temps Réel** :
   - Nombre d'instances actives sur le total configuré.
   - Requêtes actuellement en cours de calcul (*in-flight*).
   - Total des requêtes traitées avec succès.
   - Compteur d'erreurs et bascules de failover.
2. **Bandeau d'Alerte de Repli** :
   - S'affiche en rouge vif si **toutes** les instances locales sont arrêtées, signalant le repli automatique vers les LLMs distants d'Antigravity.
3. **Cartes d'Instances Détaillées** :
   - Statut en direct : 🟢 `ONLINE`, 🟡 `DEGRADED`, 🔴 `OFFLINE`.
   - Latence en millisecondes et modèles actuellement chargés dans la VRAM/RAM de chaque machine.
   - Bouton de test individuel pour chaque instance.
4. **Gestion Dynamique à Chaud** :
   - Formulaire d'ajout d'une nouvelle machine avec son rôle (`all`, `chat`, `embeddings`).
   - Suppression d'une instance en 1 clic sans devoir redémarrer le daemon ni couper Antigravity.
5. **Flux Server-Sent Events (SSE)** :
   - L'interface s'abonne à `/api/events` : chaque modification d'état, nouvelle requête ou changement de santé est poussé instantanément à l'écran sans rechargement de page.

---

## 📡 Endpoints de l'API REST Intégrée

Le serveur HTTP natif expose les routes suivantes :

| Méthode | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Page d'accueil du Dashboard Web (HTML/CSS/JS). |
| `GET` | `/api/status` | Retourne l'état complet du pool, latences et compteurs (JSON). |
| `POST` | `/api/healthcheck` | Déclenche immédiatement une sonde de santé sur toutes les instances. |
| `POST` | `/api/instances/:id/check` | Déclenche un test de santé sur une instance spécifique. |
| `POST` | `/api/instances` | Ajoute ou met à jour une instance (`{ id, name, url, roles, priority }`). |
| `DELETE` | `/api/instances/:id` | Retire une instance du pool actif. |
| `GET` | `/api/events` | Flux temps réel Server-Sent Events (SSE) poussant l'état du pool. |
| `POST` | `/mcp` ou `/rpc` | Point d'entrée HTTP pour requêtes JSON-RPC 2.0 du protocole MCP. |

