import os
import sys
import subprocess
import argparse
import threading
import itertools
import time
from datetime import datetime
from pathlib import Path

# 🚫 Exclusiones por defecto (sin .git)
EXCLUSIONES_POR_DEFECTO = [
    'bin',
    'obj',
    '.vs',
    '__pycache__',
    'node_modules',
    '.idea',
    '.vscode',
    'dist',
    'build'
]

# 🌀 Spinner de actividad
class Spinner:
    def __init__(self, mensaje="⏳ Procesando"):
        self.spinner = itertools.cycle(["|", "/", "-", "\\"])
        self.mensaje = mensaje
        self._stop_event = threading.Event()
        self.thread = threading.Thread(target=self.run)

    def run(self):
        while not self._stop_event.is_set():
            sys.stdout.write(f"\r{self.mensaje} {next(self.spinner)}")
            sys.stdout.flush()
            time.sleep(0.1)

    def start(self):
        self.thread.start()

    def stop(self):
        self._stop_event.set()
        self.thread.join()
        sys.stdout.write("\r" + " " * (len(self.mensaje) + 4) + "\r")
        sys.stdout.flush()

# 📦 Función principal
def crear_backup(proyecto_path, backup_dir=None, nombre_proyecto=None, incluir_git=False, exclusiones=None):
    proyecto_path = Path(proyecto_path).resolve()

    if not proyecto_path.is_dir():
        print("❌ La ruta del proyecto no es válida.")
        return

    # Si no hay nombre_proyecto, usar nombre del folder
    if not nombre_proyecto:
        nombre_proyecto = proyecto_path.name

    # Si no se indica carpeta backup, se crea al lado del proyecto (padre)
    if not backup_dir:
        backup_dir = proyecto_path.parent / "backups"
    else:
        backup_dir = Path(backup_dir).resolve()

    # Validar que backup_dir no esté dentro del proyecto
    if str(backup_dir).startswith(str(proyecto_path)):
        print("❌ La carpeta de backup no debe estar dentro del proyecto.")
        return

    backup_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    archivo_7z = backup_dir / f"{nombre_proyecto}_backup_{timestamp}.7z"

    # Comando base
    comando = ["7z", "a", str(archivo_7z), str(proyecto_path), "-mx9", "-ssw"]

    # Manejo de exclusiones
    exclusiones_finales = set(EXCLUSIONES_POR_DEFECTO)
    if exclusiones:
        exclusiones_finales.update(exclusiones)
    
    # Manejo de .git
    if incluir_git:
        print("📁 Incluirá .git en el backup.")
        exclusiones_finales.discard('.git')  # Asegurar que .git no esté excluido
    else:
        print("📁 Excluyendo .git del backup")
        exclusiones_finales.add('.git')

    # Añadir exclusiones al comando
    for excl in exclusiones_finales:
        comando.append(f"-xr!{excl}")
    
    # Imprimir exclusiones aplicadas
    print("\n🚫 Exclusiones aplicadas:")
    for excl in exclusiones_finales:
        print(f"  ➤ {excl}")

    print(f"\n🗜️ Comenzando backup con 7-Zip en: {archivo_7z}")
    print(f"🔧 Comando: {' '.join(comando)}")

    # Spinner
    spinner = Spinner("⏳ Comprimiendo proyecto")
    spinner.start()

    try:
        proceso = subprocess.run(comando, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        spinner.stop()

        if proceso.returncode == 0:
            print("✅ Backup completado correctamente.")
            
            # Verificación simplificada
            if incluir_git:
                # Verificar si .git existe en el proyecto
                git_path = proyecto_path / ".git"
                if git_path.exists():
                    print(f"🔍 .git existe en el proyecto y {'fue incluido' if incluir_git else 'fue excluido'} en el backup")
                else:
                    print("ℹ️ El proyecto no tiene carpeta .git")
            else:
                print("🔍 .git fue excluido según configuración")
        else:
            print(f"⚠️ Backup completado con advertencias. Código: {proceso.returncode}")
            ultimas_lineas = proceso.stdout.strip().splitlines()[-10:]
            print("🔎 Últimas líneas del error:")
            for linea in ultimas_lineas:
                print(f"  ➤ {linea.strip()}")
    except Exception as e:
        spinner.stop()
        print(f"❌ Error durante la compresión:\n{e}")

# 🎯 Main
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Backup en 7-Zip de un proyecto manteniendo estructura de carpetas.")
    parser.add_argument("ruta_proyecto", nargs='?', default=os.getcwd(), help="Ruta del proyecto (por defecto, carpeta actual).")
    parser.add_argument("-b", "--backup_dir", help="Ruta donde guardar el backup. Por defecto, se crea en ../backups.")
    parser.add_argument("-n", "--nombre_proyecto", help="Nombre del archivo de backup (sin extensión).")
    parser.add_argument("--incluir_git", action="store_true", help="Incluir .git en el backup.")
    parser.add_argument("--excluir", nargs="*", help="Carpetas o archivos adicionales a excluir (usa nombres de carpeta).")

    args = parser.parse_args()
    
    # Información de depuración
    print(f"\n🔍 VALOR DE INCLUIR_GIT: {args.incluir_git}")
    print(f"🔍 RUTA PROYECTO: {args.ruta_proyecto}")
    print(f"🔍 CARPETA BACKUP: {args.backup_dir if args.backup_dir else 'Por defecto (../backups)'}")
    print(f"🔍 EXCLUSIONES ADICIONALES: {args.excluir if args.excluir else 'Ninguna'}\n")
    
    crear_backup(
        proyecto_path=args.ruta_proyecto,
        backup_dir=args.backup_dir,
        nombre_proyecto=args.nombre_proyecto,
        incluir_git=args.incluir_git,
        exclusiones=args.excluir
    )