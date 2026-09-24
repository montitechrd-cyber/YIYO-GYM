-- =====================================================================
-- YIYO GYM — Tienda online
-- Ejecutar DESPUÉS de 0017_aislamiento_entrenadoras.sql
--
-- Catálogo de productos de la marca, carrito (que vive en el navegador de
-- cada persona) y pedidos. El pedido se guarda aquí SIEMPRE, aunque el
-- aviso por WhatsApp no llegue a enviarse: la plataforma es la fuente de
-- verdad, el WhatsApp solo es el aviso.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Productos
-- ---------------------------------------------------------------------
create table productos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nombre text not null,
  categoria text not null,
  -- Lo que lee la clienta en la tienda.
  descripcion text not null,
  -- Ficha técnica: cada línea es una característica ya confirmada.
  especificaciones text[] not null default '{}',
  cuidado text,
  -- Tallas disponibles. Vacío = producto de talla única.
  tallas text[] not null default '{}',
  precio numeric(10, 2) not null check (precio >= 0),
  imagen_url text not null,
  -- Lo que falta validar antes de prometerlo en la ficha. NO se muestra a
  -- las clientas: es el recordatorio de Yiyo de qué no puede anunciar
  -- todavía (soporte del sujetador, opacidad de los leggings, horas de
  -- frío de la botella…).
  notas_internas text,
  activo boolean not null default true,
  orden integer not null default 0,
  creado_en timestamptz not null default now()
);

create index on productos (activo, orden);

-- ---------------------------------------------------------------------
-- Pedidos
-- ---------------------------------------------------------------------
create type estado_pedido as enum (
  'nuevo',
  'confirmado',
  'enviado',
  'entregado',
  'cancelado'
);

create table pedidos (
  id uuid primary key default gen_random_uuid(),
  -- Número corto y legible para hablar con la clienta por WhatsApp: el
  -- uuid no se puede dictar por teléfono.
  numero serial not null unique,
  -- Si quien compra tiene cuenta se guarda; si no, el pedido igual entra.
  cliente_id uuid references clientes(id) on delete set null,
  nombre text not null,
  telefono text not null,
  correo text,
  -- Dirección y referencias para la entrega, tal como las escribe ella.
  entrega text,
  notas text,
  total numeric(10, 2) not null check (total >= 0),
  estado estado_pedido not null default 'nuevo',
  -- Queda constancia de si el aviso por WhatsApp llegó a abrirse.
  avisado_whatsapp boolean not null default false,
  creado_en timestamptz not null default now()
);

create index on pedidos (estado, creado_en desc);
create index on pedidos (cliente_id);

create table pedido_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references pedidos(id) on delete cascade,
  producto_id uuid references productos(id) on delete set null,
  -- El nombre, la talla y el precio se copian al pedido. Si mañana sube el
  -- precio o se retira el producto, el pedido sigue diciendo lo que se
  -- compró y por cuánto.
  nombre text not null,
  talla text,
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(10, 2) not null check (precio_unitario >= 0)
);

create index on pedido_items (pedido_id);

-- ---------------------------------------------------------------------
-- Permisos
-- ---------------------------------------------------------------------
alter table productos enable row level security;
alter table pedidos enable row level security;
alter table pedido_items enable row level security;

-- El catálogo es público: la tienda se ve sin cuenta.
create policy "catalogo publico" on productos
  for select using (activo or es_staff());

create policy "staff gestiona productos" on productos
  for all using (es_staff()) with check (es_staff());

-- Cualquiera puede hacer un pedido, tenga cuenta o no.
create policy "cualquiera pide" on pedidos
  for insert with check (true);

create policy "cada quien ve su pedido" on pedidos
  for select using (
    es_staff()
    or (cliente_id is not null and es_mi_cliente(cliente_id))
  );

create policy "staff gestiona pedidos" on pedidos
  for update using (es_staff()) with check (es_staff());

create policy "staff borra pedidos" on pedidos
  for delete using (es_admin());

create policy "cualquiera anade lineas" on pedido_items
  for insert with check (true);

create policy "lineas del pedido visible" on pedido_items
  for select using (
    exists (
      select 1 from pedidos p
      where p.id = pedido_id
        and (
          es_staff()
          or (p.cliente_id is not null and es_mi_cliente(p.cliente_id))
        )
    )
  );

-- ---------------------------------------------------------------------
-- Catálogo inicial
--
-- Precios y fichas tal como los entregó Yiyo. En `especificaciones` va
-- solo lo confirmado; lo que está pendiente de validar vive en
-- `notas_internas` y no se muestra en la tienda.
-- ---------------------------------------------------------------------
insert into productos
  (slug, nombre, categoria, precio, imagen_url, orden, tallas, descripcion, especificaciones, cuidado, notas_internas)
values
(
  'motion-bra', 'YIYO Motion Bra', 'Ropa deportiva', 28.00,
  '/tienda/motion-bra.webp', 1,
  array['XS','S','M','L','XL'],
  'Un top deportivo de líneas limpias y espalda deportiva para acompañar tu rutina con el estilo de YIYO.',
  array[
    'Tejido exterior: 78% nailon y 22% elastano, 220–250 g/m²',
    'Doble capa frontal, banda inferior ancha y costuras planas',
    'Ajuste ceñido',
    'Morado YIYO con símbolo blanco centrado',
    'Personalización por transferencia elástica'
  ],
  'Lavado suave en frío y secado al aire.',
  'Por confirmar: medidas por talla, forro, copas y nivel de soporte. NO anunciar soporte alto sin probarlo.'
),
(
  'sculpt-leggings', 'YIYO Sculpt Leggings', 'Ropa deportiva', 38.00,
  '/tienda/sculpt-leggings.webp', 2,
  array['XS','S','M','L','XL'],
  'Leggings de cintura alta y diseño depurado que combinan con tu Motion Bra.',
  array[
    'Tejido: 78% nailon y 22% elastano, 240–270 g/m²',
    'Cintura doble de aproximadamente 10 cm y costuras planas',
    'Corte ajustado, largo al tobillo, sin bolsillos',
    'Morado YIYO con símbolo blanco en la cadera',
    'Personalización por transferencia elástica'
  ],
  'Lavado en frío. Sin suavizante ni secadora.',
  'Por confirmar: entrepierna, tabla de tallas, opacidad al estirar y recuperación del tejido. NO publicar «no transparenta» sin validar una muestra.'
),
(
  'essential-tee', 'YIYO Essential Tee', 'Ropa', 22.00,
  '/tienda/essential-tee.webp', 3,
  array['XS','S','M','L','XL'],
  'Una camiseta blanca de corte amplio con el detalle justo de YIYO para completar tu look diario.',
  array[
    'Algodón peinado 100%, 190–210 g/m²',
    'Corte amplio, hombro caído y manga corta',
    'Cuello redondo con acabado acanalado',
    'Blanco con logo morado en el pecho izquierdo',
    'Serigrafía a un color'
  ],
  'Lavar del revés en frío. No planchar el estampado.',
  'Por confirmar: encogimiento, medidas y resistencia del estampado al lavado.'
),
(
  'studio-sweatshirt', 'YIYO Studio Sweatshirt', 'Ropa', 36.00,
  '/tienda/studio-sweatshirt.webp', 4,
  array['XS','S','M','L','XL'],
  'Sudadera corta y relajada para combinar con tus leggings dentro y fuera del gimnasio.',
  array[
    '80% algodón y 20% poliéster, 280–300 g/m²',
    'Interior de rizo tipo French terry',
    'Corte corto y holgado, manga larga y hombro caído',
    'Cuello redondo, puños y bajo acanalados',
    'Morado con símbolo blanco bordado en el pecho izquierdo'
  ],
  'Lavado suave en frío y secado al aire.',
  'Por confirmar: largo por talla, encogimiento y acabado interior.'
),
(
  'signature-cap', 'YIYO Signature Cap', 'Accesorios', 18.00,
  '/tienda/signature-cap.webp', 5,
  array[]::text[],
  'Una gorra blanca de diseño limpio con el símbolo YIYO bordado al frente.',
  array[
    'Sarga de algodón 100%',
    'Seis paneles, visera curva y ojales de ventilación',
    'Cierre posterior regulable',
    'Contorno 54–60 cm',
    'Blanca con bordado morado'
  ],
  'Limpiar a mano y secar conservando su forma.',
  'Por confirmar: rango real de ajuste y material del cierre.'
),
(
  'crew-socks', 'YIYO Crew Socks', 'Accesorios', 9.00,
  '/tienda/crew-socks.webp', 6,
  array['EU 35–38','EU 39–42'],
  'Calcetines de media caña con textura acanalada y un discreto símbolo morado.',
  array[
    '75% algodón, 22% poliamida y 3% elastano',
    'Caña acanalada con refuerzo en talón y puntera',
    'Altura de caña 16–18 cm',
    'Blancos con símbolo morado tejido',
    'Se venden por par'
  ],
  'Lavado a 30 °C. Evitar blanqueador.',
  'Por confirmar: equivalencias de talla, elasticidad y encogimiento.'
),
(
  'daily-bottle', 'YIYO Daily Bottle', 'Accesorios', 22.00,
  '/tienda/daily-bottle.webp', 7,
  array[]::text[],
  'Una botella blanca de acabado mate que lleva la identidad YIYO a tu rutina diaria.',
  array[
    'Capacidad 500 ml',
    'Interior de acero inoxidable 304',
    'Doble pared con aislamiento al vacío',
    'Tapa roscada con junta de silicona',
    'Aproximadamente 26 × 7 cm',
    'Blanco mate con logo morado vertical'
  ],
  'Lavado manual. No usar en microondas.',
  'Por confirmar: capacidad útil, aptitud para contacto alimentario, estanqueidad y rendimiento térmico. NO prometer horas de conservación sin ensayos.'
),
(
  'flow-mat', 'YIYO Flow Mat', 'Equipamiento', 29.00,
  '/tienda/flow-mat.webp', 8,
  array[]::text[],
  'Una esterilla morada para crear tu espacio de movimiento en casa o en el estudio.',
  array[
    'TPE con superficie texturizada',
    'Medidas 183 × 61 cm',
    'Grosor 6 mm',
    'Enrollable, incluye cinta de transporte',
    'Morada con logo blanco en un extremo',
    'Para yoga, movilidad y ejercicios de suelo'
  ],
  'Paño húmedo y jabón suave. Secar antes de enrollar.',
  'Por confirmar: agarre en seco y húmedo, peso, durabilidad y adherencia del logo. NO anunciar certificaciones ambientales sin documentación.'
),
(
  'everyday-tote', 'YIYO Everyday Tote', 'Bolsos', 18.00,
  '/tienda/everyday-tote.webp', 9,
  array[]::text[],
  'Un bolso de tela amplio y sencillo para llevar tus esenciales con el sello YIYO.',
  array[
    'Lona de algodón 100%, 280–320 g/m²',
    'Medidas 38 × 40 × 10 cm',
    'Asas de aproximadamente 60 cm',
    'Compartimento abierto con asas reforzadas',
    'Blanco natural con logo morado frontal'
  ],
  'Limpieza localizada para conservar su forma.',
  'Por confirmar: carga admisible, tono final del tejido y encogimiento.'
),
(
  'training-duffel', 'YIYO Training Duffel', 'Bolsos', 42.00,
  '/tienda/training-duffel.webp', 10,
  array[]::text[],
  'Un bolso deportivo de líneas suaves para organizar lo que necesitas en cada entrenamiento.',
  array[
    'Exterior de poliéster 600D con forro de poliéster',
    'Medidas 45 × 25 × 25 cm',
    'Cierre superior, dos asas y correa de hombro regulable',
    'Bolsillo interior para objetos personales',
    'Morado con logo blanco frontal'
  ],
  'Limpiar con paño húmedo. No lavar a máquina.',
  'Por confirmar: capacidad, carga máxima, resistencia de cierres y anclajes. NO anunciar impermeabilidad sin validación.'
),
(
  'gift-packaging', 'YIYO Gift Packaging', 'Complementos', 6.00,
  '/tienda/gift-packaging.webp', 11,
  array[]::text[],
  'Completa tu regalo con una caja YIYO, papel morado y una etiqueta a juego.',
  array[
    'Cartón rígido de 1,5–2 mm',
    'Medidas interiores 35 × 28 × 10 cm',
    'Acabado blanco mate con logo morado',
    'Incluye caja, dos hojas de papel de seda y etiqueta colgante',
    'Para prendas dobladas y accesorios pequeños'
  ],
  'Mantener en un lugar seco.',
  null
);
