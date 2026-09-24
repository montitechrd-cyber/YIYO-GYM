import { exigirRol, factoresMfa } from "@/lib/autenticacion";
import { Encabezado, Tarjeta, TituloTarjeta } from "@/components/panel/piezas";
import { FormularioPerfil } from "@/app/panel/perfil/formulario";
import { VerificacionDosPasos } from "@/components/panel/verificacion-dos-pasos";

export default async function PerfilEntrenador() {
  const perfil = await exigirRol("entrenador", "admin");
  const factores = await factoresMfa();

  return (
    <div className="max-w-4xl">
      <Encabezado
        titulo="Mi perfil"
        descripcion="Tus datos como entrenadora en la plataforma"
      />

      <div className="space-y-5">
        <Tarjeta>
          <TituloTarjeta>Datos personales</TituloTarjeta>
          <FormularioPerfil perfil={perfil} />
        </Tarjeta>

        {/* La cuenta de la entrenadora ve los datos de todas las clientas,
            así que es la que más conviene proteger con un segundo paso. */}
        <Tarjeta>
          <TituloTarjeta>Verificación en dos pasos</TituloTarjeta>
          <VerificacionDosPasos factoresIniciales={factores} />
        </Tarjeta>
      </div>
    </div>
  );
}
