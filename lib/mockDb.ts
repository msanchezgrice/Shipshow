type User = {
  id: string;
  handle: string;
  name?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type Project = {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  url?: string | null;
  imageUrl?: string | null;
  sort: number;
  createdAt: Date;
  updatedAt: Date;
};

type Subscription = {
  id: string;
  userId: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  status: string; // free | active | past_due | canceled
  priceId?: string | null;
  currentPeriodEnd?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type Domain = {
  id: string;
  userId: string;
  domain: string;
  handle: string;
  createdAt: Date;
  updatedAt: Date;
};

const db = {
  users: new Map<string, User>(),
  projects: new Map<string, Project>(),
  subscriptions: new Map<string, Subscription>(), // key by userId
  domains: new Map<string, Domain>(), // key by domain
};

function now() { return new Date(); }
function id(prefix = "id") { return `${prefix}_${Math.random().toString(36).slice(2, 10)}`; }

// Seed a default dev user for smooth UX
const defaultUserId = "dev_user_123";
if (!db.users.has(defaultUserId)) {
  const u: User = {
    id: defaultUserId,
    handle: "user-dev",
    name: "Dev User",
    bio: null,
    avatarUrl: null,
    createdAt: now(),
    updatedAt: now(),
  };
  db.users.set(u.id, u);
  const s: Subscription = {
    id: id("sub"),
    userId: u.id,
    status: "free",
    createdAt: now(),
    updatedAt: now(),
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    priceId: null,
    currentPeriodEnd: null,
  };
  db.subscriptions.set(u.id, s);
}

export const mockPrisma: any = {
  user: {
    findUnique: async ({ where, include }: any) => {
      let user: User | undefined;
      if (where?.id) user = db.users.get(where.id);
      if (!user && where?.handle) {
        user = Array.from(db.users.values()).find(u => u.handle === where.handle);
      }
      if (!user) return null;
      const result: any = { ...user };
      if (include?.projects) {
        const projects = Array.from(db.projects.values()).filter(p => p.userId === user!.id);
        projects.sort((a, b) => a.sort - b.sort);
        result.projects = projects;
      }
      if (include?.subscription) {
        result.subscription = db.subscriptions.get(user.id) || null;
      }
      if (include?.domains) {
        const domains = Array.from(db.domains.values()).filter(d => d.userId === user!.id);
        result.domains = domains;
      }
      return result;
    },
    create: async ({ data }: any) => {
      const u: User = {
        id: data.id || id("usr"),
        handle: data.handle,
        name: data.name ?? null,
        bio: data.bio ?? null,
        avatarUrl: data.avatarUrl ?? null,
        createdAt: now(),
        updatedAt: now(),
      };
      db.users.set(u.id, u);
      return u;
    },
    update: async ({ where, data }: any) => {
      const u = db.users.get(where.id);
      if (!u) throw new Error("User not found");
      const updated: User = { ...u, ...data, updatedAt: now() };
      db.users.set(updated.id, updated);
      return updated;
    },
  },
  subscription: {
    findUnique: async ({ where }: any) => {
      return db.subscriptions.get(where.userId) || null;
    },
    create: async ({ data }: any) => {
      const s: Subscription = {
        id: id("sub"),
        userId: data.userId,
        status: data.status ?? "free",
        stripeCustomerId: data.stripeCustomerId ?? null,
        stripeSubscriptionId: data.stripeSubscriptionId ?? null,
        priceId: data.priceId ?? null,
        currentPeriodEnd: data.currentPeriodEnd ?? null,
        createdAt: now(),
        updatedAt: now(),
      };
      db.subscriptions.set(s.userId, s);
      return s;
    },
    update: async ({ where, data }: any) => {
      const s = db.subscriptions.get(where.userId);
      if (!s) throw new Error("Subscription not found");
      const updated: Subscription = { ...s, ...data, updatedAt: now() };
      db.subscriptions.set(updated.userId, updated);
      return updated;
    },
    upsert: async ({ where, create, update }: any) => {
      const existing = db.subscriptions.get(where.userId);
      if (existing) {
        return mockPrisma.subscription.update({ where, data: update });
      }
      return mockPrisma.subscription.create({ data: create });
    },
  },
  project: {
    count: async ({ where }: any) => {
      return Array.from(db.projects.values()).filter(p => p.userId === where.userId).length;
    },
    create: async ({ data }: any) => {
      const p: Project = {
        id: id("prj"),
        userId: data.userId,
        title: data.title,
        description: data.description ?? null,
        url: data.url ?? null,
        imageUrl: data.imageUrl ?? null,
        sort: data.sort ?? 0,
        createdAt: now(),
        updatedAt: now(),
      };
      db.projects.set(p.id, p);
      return p;
    },
    findUnique: async ({ where }: any) => {
      return db.projects.get(where.id) || null;
    },
    update: async ({ where, data }: any) => {
      const p = db.projects.get(where.id);
      if (!p) throw new Error("Project not found");
      const updated: Project = { ...p, ...data, updatedAt: now() };
      db.projects.set(updated.id, updated);
      return updated;
    },
    delete: async ({ where }: any) => {
      const p = db.projects.get(where.id);
      if (!p) throw new Error("Project not found");
      db.projects.delete(where.id);
      return p;
    },
  },
  domain: {
    findFirst: async ({ where }: any) => {
      const domain = where?.domain;
      if (!domain) return null;
      return db.domains.get(domain) || null;
    },
    create: async ({ data }: any) => {
      const d: Domain = {
        id: id("dom"),
        userId: data.userId,
        domain: data.domain,
        handle: data.handle,
        createdAt: now(),
        updatedAt: now(),
      };
      db.domains.set(d.domain, d);
      return d;
    },
  },
};


