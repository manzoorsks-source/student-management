import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowRight, ChevronDown, Heart, Menu, Search, ShoppingBag, Sparkles, X } from 'lucide-react';
import type { ProductCard, StorefrontSummary } from '@workspace/api-client-react';

export const money = (value: number) => `₹${value.toLocaleString('en-IN')}`;

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-3 ${light ? 'text-[#f8efd7]' : 'text-primary'}`} data-testid="link-logo">
      <span className={`grid h-10 w-10 place-items-center rounded-full border ${light ? 'border-[#d8b66d]' : 'border-[#b79853]'} font-display text-xl italic transition-transform group-hover:rotate-[-8deg]`}>इ</span>
      <span className="leading-none"><strong className="block font-display text-xl tracking-[-.03em]">India Fashions</strong><small className="font-mono text-[9px] uppercase tracking-[.24em] opacity-70">since 1986 · jaipur</small></span>
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const nav = [['Shop all', '/shop'], ['Silk sarees', '/shop?fabric=Silk'], ['New arrivals', '/shop?sort=newest'], ['Our story', '/#story']];
  return (
    <header className="relative z-20 border-b border-primary/10 bg-[hsl(var(--background)/.86)] backdrop-blur-md">
      <div className="mx-auto flex max-w-[1380px] items-center justify-between px-5 py-4 lg:px-10">
        <button onClick={() => setOpen(!open)} className="rounded-full p-2 lg:hidden" aria-label="Toggle menu" data-testid="button-toggle-menu">{open ? <X size={20} /> : <Menu size={20} />}</button>
        <Logo />
        <nav className="hidden items-center gap-8 lg:flex">
          {nav.map(([label, href]) => <Link key={href} href={href} className={`text-[11px] font-semibold uppercase tracking-[.15em] transition-colors hover:text-secondary ${location === href ? 'text-secondary' : 'text-primary/75'}`} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>{label}</Link>)}
        </nav>
        <div className="flex items-center gap-1">
          <Link href="/shop" className="rounded-full p-2.5 transition-colors hover:bg-primary/10" aria-label="Search products" data-testid="link-search"><Search size={18} /></Link>
          <Link href="/cart" className="relative rounded-full p-2.5 transition-colors hover:bg-primary/10" aria-label="Shopping bag" data-testid="link-cart"><ShoppingBag size={18} /><span className="absolute right-1 top-1 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-secondary px-1 font-mono text-[8px] text-secondary-foreground" data-testid="text-cart-count">0</span></Link>
        </div>
      </div>
      {open && <div className="absolute inset-x-0 top-full border-b border-primary/10 bg-[hsl(var(--card))] p-6 shadow-lg lg:hidden"><nav className="grid gap-5">{nav.map(([label, href]) => <Link onClick={() => setOpen(false)} key={href} href={href} className="font-display text-2xl" data-testid={`link-mobile-${label.toLowerCase().replaceAll(' ', '-')}`}>{label}</Link>)}</nav></div>}
    </header>
  );
}

export function Ticker({ items = [] }: { items?: string[] }) {
  const words = items.length ? items : ['Handwoven in India', 'Family-run since 1986', 'Complimentary styling advice'];
  return <div className="overflow-hidden border-y border-primary/15 bg-primary py-2.5 text-primary-foreground"><div className="marquee flex w-max items-center">{[...words, ...words].map((item, i) => <span key={`${item}-${i}`} className="mx-7 inline-flex items-center gap-7 font-mono text-[10px] uppercase tracking-[.2em]"><Sparkles size={11} className="text-accent" />{item}</span>)}</div></div>;
}

export function ProductImage({ image, alt, className = '' }: { image?: { url?: string; alt?: string }; alt?: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!image?.url || failed) return <div className={`relative overflow-hidden bg-[linear-gradient(135deg,#afcad5,#edd9ae_48%,#7d2f42)] ${className}`}><div className="absolute inset-0 silk-shine opacity-60" /><span className="absolute bottom-4 left-4 font-display text-2xl italic text-[#f8efd7]/80">India Fashions</span></div>;
  return <img src={image.url} alt={alt || image.alt || ''} onError={() => setFailed(true)} className={`object-cover ${className}`} />;
}

export function StatusPill({ children, tone = 'gold' }: { children: React.ReactNode; tone?: 'gold' | 'green' | 'maroon' | 'blue' }) {
  const colors = { gold: 'bg-accent/25 text-primary', green: 'bg-primary/10 text-primary', maroon: 'bg-secondary/10 text-secondary', blue: 'bg-[#b4d9e5] text-primary' };
  return <span className={`inline-flex rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[.08em] ${colors[tone]}`} data-testid="status-pill">{children}</span>;
}

export function ProductCardView({ product, featured = false }: { product: ProductCard; featured?: boolean }) {
  return <Link href={`/product/${product.slug}`} className={`group block ${featured ? 'md:col-span-2' : ''}`} data-testid={`card-product-${product.id}`}>
    <div className={`relative overflow-hidden rounded-[1.25rem] bg-card ${featured ? 'aspect-[1.28]' : 'aspect-[.82]'}`}>
      <ProductImage image={product.image} alt={product.name} className="h-full w-full transition-transform duration-700 group-hover:scale-[1.045]" />
      {product.badge && <StatusPill tone="gold"><span>{product.badge}</span></StatusPill>}
      <button onClick={(e) => e.preventDefault()} aria-label={`Save ${product.name}`} className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-[#f8efd7]/80 text-primary opacity-0 backdrop-blur transition-all group-hover:opacity-100" data-testid={`button-favorite-${product.id}`}><Heart size={15} /></button>
      <span className="absolute bottom-4 left-4 rounded-full bg-[#f8efd7]/80 px-3 py-1 font-mono text-[9px] uppercase tracking-widest text-primary backdrop-blur">{product.availability.replace('_', ' ')}</span>
    </div>
    <div className="flex items-start justify-between gap-3 px-1 pt-4">
      <div><p className="font-display text-lg leading-tight">{product.name}</p><p className="mt-1 text-xs text-muted-foreground">{product.fabric} · {product.category}</p></div>
      <div className="text-right"><p className="font-mono text-xs">{money(product.price)}</p>{product.originalPrice && <p className="font-mono text-[10px] text-muted-foreground line-through">{money(product.originalPrice)}</p>}</div>
    </div>
  </Link>;
}

export function SectionHeading({ eyebrow, title, body, action }: { eyebrow: string; title: string; body?: string; action?: string }) {
  return <div className="mb-9 flex items-end justify-between gap-6"><div><p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[.22em] text-secondary">{eyebrow}</p><h2 className="font-display text-4xl leading-[.98] tracking-[-.035em] md:text-5xl">{title}</h2>{body && <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">{body}</p>}</div>{action && <Link href="/shop" className="hidden shrink-0 items-center gap-2 border-b border-primary pb-1 text-[10px] font-bold uppercase tracking-[.16em] md:flex" data-testid="link-section-action">{action}<ArrowRight size={14} /></Link>}</div>;
}

export function LoadingState({ label = 'Gathering the collection' }: { label?: string }) {
  return <div className="grid gap-4 sm:grid-cols-3" aria-label="Loading"><div className="h-72 animate-pulse rounded-2xl bg-primary/10" /><div className="h-72 animate-pulse rounded-2xl bg-primary/10" /><div className="h-72 animate-pulse rounded-2xl bg-primary/10" /><p className="col-span-full font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}…</p></div>;
}

export function QueryState({ error, onRetry }: { error?: unknown; onRetry: () => void }) {
  return <div className="rounded-2xl border border-secondary/20 bg-card p-10 text-center"><p className="font-display text-2xl">{error ? 'The atelier is taking a moment.' : 'Nothing here yet.'}</p><p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{error ? 'Please try again. Your collection is safe with us.' : 'Check back shortly for the next edit.'}</p><button onClick={onRetry} className="mt-6 rounded-full bg-primary px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-primary-foreground transition-transform hover:-translate-y-0.5" data-testid="button-retry">Try again</button></div>;
}

export function Footer() {
  return <footer className="mt-24 bg-primary px-5 py-14 text-primary-foreground lg:px-10"><div className="mx-auto grid max-w-[1380px] gap-12 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]"><div><Logo light /><p className="mt-5 max-w-xs text-sm leading-6 text-primary-foreground/65">A family wardrobe of Indian textiles, chosen slowly and sent with care from our Jaipur home.</p></div><div><p className="mb-5 font-mono text-[10px] uppercase tracking-widest text-accent">Explore</p><div className="grid gap-3 text-sm text-primary-foreground/75"><Link href="/shop" data-testid="link-footer-shop">Shop all</Link><Link href="/shop?sort=newest" data-testid="link-footer-new">New arrivals</Link><Link href="/#story" data-testid="link-footer-story">Our story</Link></div></div><div><p className="mb-5 font-mono text-[10px] uppercase tracking-widest text-accent">Visit us</p><p className="text-sm leading-6 text-primary-foreground/75">18 Johari Bazaar<br />Jaipur, Rajasthan 302003<br />+91 141 257 1986</p></div><div><p className="mb-5 font-mono text-[10px] uppercase tracking-widest text-accent">A note from us</p><p className="font-display text-xl italic text-primary-foreground/90">“The right saree does not wait for an occasion.”</p></div></div><div className="mx-auto mt-14 max-w-[1380px] border-t border-primary-foreground/15 pt-5 font-mono text-[9px] uppercase tracking-widest text-primary-foreground/45">© 2025 India Fashions · Jaipur · made for keeps</div></footer>;
}

export function AdminShell({ children, title, eyebrow }: { children: React.ReactNode; title: string; eyebrow: string }) {
  const [location] = useLocation();
  const links = [['Overview', '/admin'], ['Products', '/admin/products'], ['Orders', '/admin/orders'], ['Advance orders', '/admin/advance-orders'], ['Settings', '/admin/settings']];
  return <div className="min-h-[100dvh] bg-[#e1f1f4] text-primary"><aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-primary p-7 text-primary-foreground lg:flex"><Logo light /><p className="mt-16 font-mono text-[9px] uppercase tracking-[.22em] text-accent">Operations desk</p><nav className="mt-5 grid gap-1">{links.map(([label, href]) => <Link key={href} href={href} className={`rounded-lg px-3 py-3 text-sm transition-colors ${location === href ? 'bg-primary-foreground/10 text-accent' : 'text-primary-foreground/65 hover:bg-primary-foreground/5 hover:text-primary-foreground'}`} data-testid={`link-admin-${label.toLowerCase().replaceAll(' ', '-')}`}>{label}</Link>)}</nav><div className="mt-auto rounded-xl border border-primary-foreground/15 p-4"><p className="font-display text-lg">Good morning, Asha.</p><p className="mt-1 text-xs text-primary-foreground/55">The floor is ready when you are.</p></div></aside><main className="min-h-[100dvh] lg:ml-64"><div className="border-b border-primary/10 bg-[#e1f1f4] px-5 py-5 lg:px-10"><div className="mx-auto flex max-w-[1300px] items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-secondary">{eyebrow}</p><h1 className="mt-1 font-display text-3xl">{title}</h1></div><Link href="/" className="rounded-full border border-primary/20 px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-primary-foreground" data-testid="link-view-store">View store</Link></div></div><div className="mx-auto max-w-[1300px] p-5 lg:p-10">{children}</div></main></div>;
}

export function useCart() {
  const [items, setItems] = useState<Array<{ variantId: string; productName: string; sku: string; quantity: number; unitPrice: number; image?: { url?: string; alt?: string } }>>([]);
  useEffect(() => { try { setItems(JSON.parse(localStorage.getItem('if-cart') || '[]')); } catch {} }, []);
  const save = (next: typeof items) => { setItems(next); localStorage.setItem('if-cart', JSON.stringify(next)); };
  return { items, add: (item: typeof items[number]) => save([...items.filter((x) => x.variantId !== item.variantId), item]), remove: (id: string) => save(items.filter((x) => x.variantId !== id)), update: (id: string, quantity: number) => save(items.map((x) => x.variantId === id ? { ...x, quantity } : x)), total: useMemo(() => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [items]) };
}