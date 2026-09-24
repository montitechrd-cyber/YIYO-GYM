-- =====================================================================
-- YIYO GYM — Precios definitivos de los planes
-- Ejecutar DESPUÉS de 0015_registro_hecho.sql
--
-- Los precios reales del negocio: US$100, US$160 y US$200. Los de la
-- semilla original eran solo un ejemplo. No se toca el nombre, la
-- descripción ni los beneficios de cada plan, ni si ya tiene un
-- `paypal_plan_id` asignado.
-- =====================================================================

update planes set precio_mensual = 100 where nombre = 'Esencial';
update planes set precio_mensual = 160 where nombre = 'Transformación';
update planes set precio_mensual = 200 where nombre = 'Élite';
