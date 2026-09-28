from pathlib import Path
from urllib.request import urlretrieve
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, KeepTogether, Table, TableStyle
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
from reportlab.lib.enums import TA_LEFT
from pypdf import PdfReader

ROOT=Path(__file__).resolve().parent.parent; OUT=ROOT/'output/pdf'; TMP=ROOT/'tmp/pdfs'
OUT.mkdir(parents=True, exist_ok=True); TMP.mkdir(parents=True, exist_ok=True)
for name in ['Regular','Medium','SemiBold']:
    f=TMP/f'Poppins-{name}.ttf'
    if not f.exists(): urlretrieve(f'https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-{name}.ttf',f)
    pdfmetrics.registerFont(TTFont('Poppins'+name,str(f)))
pdfmetrics.registerFontFamily('PoppinsRegular',normal='PoppinsRegular',bold='PoppinsSemiBold',italic='PoppinsRegular',boldItalic='PoppinsSemiBold')
V=HexColor('#6A2CAB'); DARK=HexColor('#3F1A6B'); L=HexColor('#E9D6FF'); CREAM=HexColor('#FFFDFA'); GRAY=HexColor('#655572')
W,H=595.28,841.89; BASE='https://web-production-6bd61.up.railway.app'
styles={
 'title':ParagraphStyle('title',fontName='PoppinsMedium',fontSize=27,leading=34,textColor=DARK,spaceAfter=14),
 'body':ParagraphStyle('body',fontName='PoppinsRegular',fontSize=10,leading=16,textColor=DARK,spaceAfter=10),
 'small':ParagraphStyle('small',fontName='PoppinsRegular',fontSize=8.5,leading=13,textColor=GRAY,spaceAfter=9),
 'h2':ParagraphStyle('h2',fontName='PoppinsSemiBold',fontSize=12,leading=18,textColor=V,spaceBefore=13,spaceAfter=8),
 'kicker':ParagraphStyle('kicker',fontName='PoppinsMedium',fontSize=9,leading=14,textColor=V,spaceAfter=12),
 'cover':ParagraphStyle('cover',fontName='PoppinsMedium',fontSize=38,leading=47,textColor=white,spaceAfter=22),
 'sub':ParagraphStyle('sub',fontName='PoppinsRegular',fontSize=14,leading=22,textColor=L,spaceAfter=18),
 'note':ParagraphStyle('note',fontName='PoppinsRegular',fontSize=9,leading=15,textColor=DARK),
}
def p(t,s='body'): return Paragraph(t,styles[s])
def note(t):
    tab=Table([[p(t,'note')]],colWidths=[487]);tab.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),L),('BOX',(0,0),(-1,-1),0.5,HexColor('#DCC3FB')),('LEFTPADDING',(0,0),(-1,-1),15),('RIGHTPADDING',(0,0),(-1,-1),15),('TOPPADDING',(0,0),(-1,-1),12),('BOTTOMPADDING',(0,0),(-1,-1),12)]));return tab

def draw_page(c,doc,role):
    c.saveState()
    if doc.page==1:
        c.setFillColor(DARK);c.rect(0,0,W,H,fill=1,stroke=0)
        c.setFillColor(V);c.circle(W+10,H-130,240,fill=1,stroke=0)
        c.setFillColor(HexColor('#9170F5'));c.circle(W+90,75,235,fill=1,stroke=0)
        c.drawImage(str(ROOT/'public/logo-yiyo-gym-horizontal-blanco.png'),54,H-112,width=218,height=53,mask='auto')
        c.setFont('PoppinsRegular',10);c.setFillColor(L);c.drawString(54,105,'Fuerza que te transforma')
        c.setFont('PoppinsRegular',8);c.drawString(54,81,'GUÍA DE USO  /  SEPTIEMBRE 2026')
    else:
        c.setFillColor(CREAM);c.rect(0,0,W,H,fill=1,stroke=0)
        c.drawImage(str(ROOT/'public/logo-yiyo-gym-horizontal.png'),54,H-59,width=103,height=25,mask='auto')
        c.setFillColor(GRAY);c.setFont('PoppinsRegular',8);c.drawRightString(W-54,H-48,role.upper())
        c.setStrokeColor(L);c.line(54,51,W-54,51)
        c.setFillColor(GRAY);c.drawString(54,34,'YIYO GYM  |  Manual de uso  |  27.09.2026')
        c.setFillColor(V);c.drawRightString(W-54,34,f'{doc.page:02d}')
    c.restoreState()

def steps(items):
    out=[]
    for i,t in enumerate(items,1):
        out.append(p(f'<font color="#9170F5"><b>{i:02d}.</b></font>  {t}'))
    return out

def make(filename,role,title,subtitle,contents,pages):
    story=[Spacer(1,128),p('MANUAL DE USO','sub'),p(title,'cover'),p(subtitle,'sub'),Spacer(1,12),p(contents,'sub'),PageBreak()]
    for idx,sec in enumerate(pages):
        tag,title,route,blocks,tip=sec
        story += [p(tag.upper(),'kicker'),p(title,'title')]
        if route: story.append(p(f'<link href="{BASE}{route}" color="#6A2CAB">Abrir en la plataforma: {route}</link>','small'))
        for heading,body in blocks:
            if heading:story.append(p(heading,'h2'))
            story.extend(steps(body) if isinstance(body,list) else [p(body)])
        if tip:story += [Spacer(1,9),note(tip)]
        if idx<len(pages)-1:story.append(PageBreak())
    doc=SimpleDocTemplate(str(OUT/filename),pagesize=(W,H),rightMargin=54,leftMargin=54,topMargin=86,bottomMargin=72,title='YIYO GYM | '+role,author='YIYO GYM',subject='Instructivo de la plataforma')
    doc.build(story,onFirstPage=lambda c,d:draw_page(c,d,role),onLaterPages=lambda c,d:draw_page(c,d,role))
    reader=PdfReader(OUT/filename)
    assert len(reader.pages)==len(pages)+1,(filename,len(reader.pages))
    for i,page in enumerate(reader.pages):
        assert len(page.extract_text())>150,(filename,i)
    print(filename,len(reader.pages),'páginas')

admin=[
('01 / Acceso y roles','Tu espacio de trabajo','/entrar',[
('Entrar a la plataforma',[
'Abre el enlace de acceso e introduce el correo y la contraseña de tu cuenta. Pulsa <b>Entrar</b>. Si tienes verificación en dos pasos, completa el código solicitado.',
'Como administradora llegarás a <b>Resumen</b> en /admin. Como entrenadora, a /entrenador. En teléfono, toca <b>Abrir menú</b> para mostrar las secciones.',
'Para actualizar tu contraseña con una sesión abierta, visita <link href="'+BASE+'/nueva-contrasena" color="#6A2CAB">/nueva-contrasena</link>. Si no puedes entrar, usa <b>Recuperar contraseña</b> en el acceso.'
]),
('Quién puede hacer qué','<b>Entrenadora:</b> Clientes, Sesiones, Rutinas, Ejercicios, Nutrición, Alimentos, Mensajes y Mi perfil.<br/><b>Administradora:</b> dispone de esas funciones y además Usuarios, Planes y pagos, Pedidos, Analytics y Configuración.'),
('Tu recorrido habitual','Clientes → evaluación → Rutinas y Nutrición → Sesiones → Mensajes → revisión del progreso.')
],'<b>Seguridad:</b> cada entrenadora debe usar su propia cuenta. No incluyas contraseñas ni datos privados de clientas en documentos que vayas a compartir.'),
('02 / Clientes','Prepara una ficha útil','/entrenador/clientes',[
('Recibir y revisar una clienta',[
'La clienta crea su cuenta y completa la evaluación inicial. Abre <b>Clientes</b>, localízala en la lista y entra en su ficha.',
'Revisa objetivo, nivel, disponibilidad y la evaluación. Si faltan datos, acuerda completarlos antes de diseñar su programa.',
'Edita el estado, origen, objetivo, nivel, etiquetas o notas de la ficha y pulsa <b>Guardar cambios</b>. Si la ficha está sin asignar y aparece la opción de asignártela, úsala para asumir el seguimiento.',
'En la evaluación registra las medidas que hayas tomado y guarda. En las notas añade acuerdos, revisiones y contexto que facilite el próximo seguimiento.'
]),
('Medir y dar continuidad','Abre el progreso de la clienta desde su ficha para consultar las gráficas y las fotos disponibles. Usa la opción de registrar una medición cuando corresponda y comprueba la fecha y las unidades antes de guardar.'),
('Antes de cerrar la ficha','Verifica que la clienta tiene una entrenadora asignada y que los datos guardados corresponden a la persona correcta.')
],'<b>Si la clienta no aparece:</b> confirma que terminó el registro y que estás en la cuenta correcta. El acceso de una entrenadora está limitado por la asignación de clientas.'),
('03 / Entrenamiento','Asigna y programa una rutina','/entrenador/rutinas',[
('Usar un programa del catálogo',[
'En <b>Rutinas</b>, explora los programas por nivel u objetivo. Elige <b>Asignar</b> en el programa adecuado.',
'Selecciona <b>Para quién</b>, la fecha de inicio y las semanas. Revisa la selección y pulsa <b>Asignar programa</b>.',
'Abre la rutina de la clienta y revisa sus días, ejercicios y prescripciones antes de indicarle que empiece.'
]),
('Crear desde cero',[
'Abre la creación de una rutina. Completa nombre, descripción, clienta, días por semana, semanas e inicio. Si no eliges clienta, se guarda como plantilla.',
'En el constructor de cada día añade los ejercicios y ajusta series, repeticiones, carga, descansos y notas que necesites. Guarda con <b>Guardar día</b>.',
'Usa <b>Programar en el calendario</b> cuando corresponda; elige la semana inicial y pulsa <b>Programar</b>. Comprueba el resultado en <b>Sesiones</b>.'
])
],'<b>Antes de salir:</b> comprueba que no quedan cambios sin guardar en el día. Editar una plantilla no equivale a asignarla a una clienta.'),
('04 / Alimentación','Construye el acompañamiento nutricional','/entrenador/dietas',[
('Asignar un plan',[
'En <b>Nutrición</b>, abre un plan del catálogo y pulsa <b>Asignar</b>.',
'Elige la clienta, revisa las calorías y los objetivos que muestra el formulario, e indica la fecha de inicio y la duración.',
'Pulsa <b>Asignar plan</b> y abre el plan resultante para verificar comidas, cantidades y objetivos.'
]),
('Crear o ajustar un plan',[
'Para empezar desde cero, selecciona la clienta, escribe el nombre y la descripción del plan y completa los objetivos. Pulsa <b>Crear dieta</b>.',
'En el constructor organiza los días y comidas. Añade alimentos y sus cantidades, y revisa cómo se calculan los totales.',
'Usa <b>Objetivo diario</b> para ajustar los objetivos y <b>Cuándo empieza y cuánto dura</b> para revisar la vigencia. Guarda los cambios y comprueba el plan activo.'
]),
('Biblioteca de alimentos','La sección <b>Alimentos</b> sirve para consultar el catálogo que se utiliza en los planes. Verifica la unidad y la cantidad al añadir un alimento; ambas afectan los totales mostrados.')
],'<b>Si no se ve un plan:</b> revisa la clienta seleccionada, el estado activo y sus fechas. La clienta lo consulta en Mi alimentación.'),
('05 / Seguimiento','Organiza la semana y conversa','/entrenador/calendario',[
('Crear una sesión',[
'En <b>Sesiones</b>, pulsa <b>Nueva sesión</b> y selecciona la clienta.',
'Si corresponde, vincula un día de su rutina. Completa título, fecha, hora, duración y notas. Revisa la opción de repetir antes de guardar.',
'Comprueba que la sesión aparece en la fecha prevista y que no duplica otra programación.'
]),
('Mensajes y notificaciones',[
'Abre <b>Mensajes</b>, selecciona la conversación de la clienta, escribe y envía tu respuesta. Confirma la destinataria antes de compartir información personal.',
'Consulta las notificaciones del panel para localizar cambios y avisos. Usa los enlaces de cada aviso para ir a la sección correspondiente.',
'Antes de ajustar un programa, revisa el progreso y los registros disponibles en la ficha de la clienta; pregunta por chat cuando falte contexto.'
]),
('Cierre de la semana','Revisa sesiones, dudas pendientes y cambios acordados. Guarda los ajustes de rutina o alimentación y explica a la clienta qué debe consultar en su panel.')
],'<b>Una agenda útil:</b> el calendario muestra lo programado. Los registros de entrenamiento y las marcas de cumplimiento aportan el seguimiento de lo realizado.'),
('06 / Administración','Gestiona usuarios, planes y pedidos','/admin',[
('Usuarios y acceso','En <b>Usuarios</b>, localiza la cuenta y usa su selector de rol para asignar cliente, entrenador o admin. Comprueba el correo antes de cambiar permisos. La plataforma impide que cambies tu propio rol.'),
('Planes y pagos','Usa <b>Nuevo plan</b> o <b>Editar</b> para mantener nombre, descripción, precio mensual, beneficios, orden y visibilidad. Guarda y revisa la lista. <b>Los pagos online están deshabilitados por ahora.</b> El historial sigue disponible; los nuevos acuerdos de pago se coordinan directamente con la clienta. Esta pantalla no ofrece un formulario para registrar cobros manuales.'),
('Pedidos de la tienda',[
'Abre <b>Pedidos</b> y revisa los artículos y los datos de contacto y entrega.',
'Acuerda disponibilidad, pago y entrega con la compradora. Abrir WhatsApp no significa que un pedido esté pagado.',
'Actualiza el estado según avance: nuevo, confirmado, enviado, entregado o cancelado.'
]),
('Analytics y configuración','<b>Analytics</b> resume la información registrada en la plataforma. Los pagos externos no aparecen automáticamente. <b>Configuración</b> muestra una función próxima; los ajustes nutricionales generales todavía no se editan allí.')
],'<b>Mi perfil:</b> actualiza tus datos personales y guarda. Puedes gestionar la verificación en dos pasos. El correo no se cambia desde ese formulario.'),
('07 / Consulta rápida','Tu lista de control','/entrenador/clientes',[
('Cada día','Revisa mensajes y avisos → consulta las sesiones → resuelve dudas → registra acuerdos en la ficha → comprueba que los cambios quedaron guardados.'),
('Al incorporar una clienta','Cuenta creada y confirmada, cuando aplique; evaluación enviada; entrenadora asignada; rutina revisada; plan de alimentación revisado; calendario correcto; instrucciones iniciales explicadas por chat.'),
('Si algo no aparece',[
'<b>Sin rutina:</b> comprueba la asignación, la clienta y el estado de la rutina.',
'<b>Sin sesiones:</b> revisa el intervalo de fechas del calendario y la programación del plan.',
'<b>Sin progreso:</b> comprueba que existen mediciones o entrenamientos guardados; las gráficas necesitan registros.',
'<b>Error de acceso:</b> verifica el correo, usa recuperar contraseña si hace falta y comprueba el rol con la administradora.'
]),
('Enlaces de consulta','<link href="'+BASE+'/entrenador/rutinas" color="#6A2CAB">Rutinas</link> · <link href="'+BASE+'/entrenador/dietas" color="#6A2CAB">Nutrición</link> · <link href="'+BASE+'/entrenador/chat" color="#6A2CAB">Mensajes</link> · <link href="'+BASE+'/admin/planes" color="#6A2CAB">Planes y pagos</link>')
],'<b>Al terminar:</b> usa Cerrar sesión si compartes el dispositivo. Este manual refleja las funciones revisadas el 27 de septiembre de 2026; las pantallas pueden evolucionar.')]

client=[
('01 / Primer acceso','Entra y cuéntanos de ti','/entrar',[
('Crear tu cuenta o iniciar sesión',[
'Si ya tienes cuenta, escribe tu correo y contraseña y pulsa <b>Entrar</b>. Si es tu primera vez, abre <b>Registro</b> y completa los datos solicitados.',
'Si la plataforma solicita confirmar el correo, abre el mensaje recibido y utiliza su enlace. Revisa también la carpeta de correo no deseado.',
'Completa la evaluación inicial con tu objetivo, experiencia, días disponibles, equipo y los datos personales que conozcas. Solo la fecha es obligatoria; no inventes medidas.',
'Pulsa <b>Enviar mi evaluación</b>. Las medidas corporales se completan con Yiyo. Tu entrenadora utilizará la información para preparar tu acompañamiento.'
]),
('Moverte por tu panel','En laptop verás el menú lateral. En teléfono pulsa <b>Abrir menú</b>. Desde allí puedes entrar en Resumen, Mis entrenamientos, Mi alimentación, Calendario, Mi progreso, Chat con Yiyo, Mi suscripción y Mi perfil.'),
('Si olvidaste la contraseña','En la pantalla de acceso elige <b>Recuperar contraseña</b>, escribe tu correo y sigue el enlace del mensaje para crear una nueva.')
],'<b>Primeros días:</b> si aún no ves una rutina o alimentación, puede que Yiyo esté preparando tu plan. Pregúntale por Chat con Yiyo.'),
('02 / Tu entrenamiento','Consulta, entrena y registra','/panel/entrenamientos',[
('Antes de empezar',[
'Abre <b>Mis entrenamientos</b> y selecciona el día de tu rutina que corresponde.',
'Revisa los ejercicios, series, repeticiones, carga indicada y descansos. Consulta la demostración disponible y las notas de Yiyo.',
'Sigue el orden del día. Cuando completes un ejercicio, utiliza su opción <b>Hecho</b> si aparece.'
]),
('Guardar tu sesión',[
'Abre <b>Registrar entrenamiento</b> y selecciona el día de rutina y la fecha correctos.',
'Completa las series, repeticiones y pesos que realmente realizaste. Añade duración, esfuerzo, sensación y notas cuando corresponda.',
'Pulsa <b>Guardar entrenamiento</b> y revisa que el registro aparezca en tu historial.'
]),
('Qué conviene anotar','Ejemplo de una nota útil: “En la última serie hice 8 repeticiones con 10 kg; me costó mantener el ritmo”. Los datos concretos ayudan a Yiyo a revisar tu siguiente sesión.')
],'<b>Hecho y registro:</b> marcar un ejercicio ayuda a seguir el día. Para conservar el detalle de cargas y repeticiones, utiliza también el registro del entrenamiento.'),
('03 / Alimentación y agenda','Encuentra lo que toca hoy','/panel/alimentacion',[
('Consultar tu alimentación',[
'Abre <b>Mi alimentación</b>. Selecciona el día y revisa sus comidas, alimentos y cantidades.',
'Consulta los objetivos y el resumen de calorías y macronutrientes. Son los valores del plan que Yiyo te ha asignado.',
'En el día de hoy, marca las comidas que hayas cumplido. Si marcas una por error, utiliza su control para corregirla.'
]),
('Consultar el calendario',[
'Abre <b>Calendario</b> y busca la fecha que necesitas.',
'Revisa el título, la hora y los detalles de tus sesiones. Abre los enlaces disponibles para consultar la actividad relacionada.',
'Si necesitas cambiar una fecha o tienes dudas sobre una comida, contacta con Yiyo por el chat.'
]),
('Si no aparece contenido','Comprueba que estás en el día correcto. Si no tienes un plan activo o sesiones programadas, escribe a Yiyo para confirmar la asignación y las fechas.')
],'<b>Registro diario:</b> las marcas de comidas corresponden al día actual. El resumen refleja las comidas que marcaste; no es un registro automático de todo lo que consumes.'),
('04 / Progreso y conversación','Haz visible tu evolución','/panel/progreso',[
('Guardar un control de progreso',[
'Abre <b>Mi progreso</b> y utiliza la opción para registrar progreso.',
'Comprueba la fecha. Introduce el peso y los demás datos que conozcas; revisa las unidades. Puedes añadir fotos y notas en el formulario.',
'Pulsa <b>Guardar</b> y consulta las gráficas y la galería. Los cambios se entienden mejor al comparar varios registros.'
]),
('Hablar con tu entrenadora',[
'Abre <b>Chat con Yiyo</b>, escribe tu consulta y envíala.',
'Da contexto: día, ejercicio o comida, qué ocurrió y qué necesitas aclarar. Por ejemplo: “El martes no podré entrenar; ¿cómo reorganizo la semana?”.',
'Revisa las notificaciones del panel y vuelve al chat para leer las respuestas.'
]),
('Fotos que ayudan a comparar','Si decides registrar fotos, procura usar una distancia, luz y postura similares. Selecciona solo las imágenes que quieras compartir para tu seguimiento.')
],'<b>Si una gráfica está vacía:</b> revisa si ya hay registros guardados. La plataforma necesita datos para mostrar tu evolución.'),
('05 / Cuenta y planes','Gestiona tu cuenta con confianza','/panel/perfil',[
('Actualizar tu perfil',[
'En <b>Mi perfil</b>, revisa tu nombre, teléfono y los demás datos disponibles.',
'Modifica lo necesario y pulsa <b>Guardar cambios</b>. El correo aparece como un campo que no se puede editar aquí.',
'Si quieres cambiar tu contraseña con la sesión abierta, entra en <link href="'+BASE+'/nueva-contrasena" color="#6A2CAB">/nueva-contrasena</link>, escribe la nueva clave dos veces y guarda.'
]),
('Tu plan y los pagos','En <b>Mi suscripción</b> puedes consultar los planes y el historial disponible. <b>Por ahora no hay pagos online.</b> Usa <b>Consultar mi plan con Yiyo</b> para abrir el chat y coordinar las condiciones y la forma de pago. Consultar un plan no realiza un cobro ni lo activa automáticamente.'),
('Tienda','En <b>Tienda</b>, revisa productos, talla y cantidad, y completa tus datos al tramitar un pedido. Confirma con Yiyo su recepción, disponibilidad, pago y entrega; la gestión continúa por contacto directo.'),
('Tu rutina digital','Antes de entrenar, consulta el plan. Después, guarda el registro. Al finalizar el día, revisa comidas y mensajes. En un equipo compartido, usa <b>Cerrar sesión</b>.')
],'<b>¿Necesitas ayuda?</b> Usa Chat con Yiyo. Si no puedes acceder, contacta por WhatsApp al +1 (829) 879-7333. Manual revisado el 27 de septiembre de 2026.')]
make('yiyo-gym-manual-admin-entrenador.pdf','Administración y entrenamiento','Acompaña con\nclaridad'.replace('\n','<br/>'),'Guía para administradoras y entrenadoras','Acceso · Clientas · Rutinas · Nutrición<br/>Seguimiento · Gestión del negocio',admin)
make('yiyo-gym-manual-clientes.pdf','Guía para clientas','Tu proceso,\npaso a paso'.replace('\n','<br/>'),'Guía para usar tu espacio en YIYO GYM','Primer acceso · Entrenamientos · Alimentación<br/>Progreso · Chat · Tu cuenta',client)
