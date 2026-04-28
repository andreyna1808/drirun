#!/usr/bin/env python3
"""
Script para adicionar fallback de plataforma web nos arquivos que usam react-native-maps.
"""
import re

def fix_tracking():
    with open("app/tracking.tsx", "r", encoding="utf-8") as f:
        content = f.read()

    # Substituir o bloco MapView por renderização condicional
    # Encontrar o padrão <MapView ... > ... </MapView>
    pattern = r'(\s+)\{/\*.*?Mapa.*?\*/\}\s*\n(\s+)<MapView(.*?)</MapView>'
    
    new_block = r'''\1{/* Mapa — apenas em plataformas nativas */}
\1{Platform.OS !== "web" && MapView ? (
\2<MapView\3</MapView>
\1) : (
\2<MapFallback style={styles.map} />
\1)}'''
    
    result = re.sub(pattern, new_block, content, flags=re.DOTALL)
    
    if result != content:
        with open("app/tracking.tsx", "w", encoding="utf-8") as f:
            f.write(result)
        print("tracking.tsx: MapView atualizado com fallback!")
    else:
        print("tracking.tsx: padrão não encontrado, tentando abordagem alternativa...")
        # Abordagem alternativa: substituição simples de linha
        lines = content.split('\n')
        new_lines = []
        i = 0
        while i < len(lines):
            line = lines[i]
            # Encontrar a linha com <MapView
            if '      <MapView' in line and 'ref={mapRef}' in lines[i+1] if i+1 < len(lines) else False:
                # Adicionar wrapper condicional
                new_lines.append('      {Platform.OS !== "web" && MapView ? (')
                # Adicionar todas as linhas do MapView com indentação extra
                depth = 0
                j = i
                while j < len(lines):
                    new_lines.append('  ' + lines[j])
                    if '<MapView' in lines[j]:
                        depth += 1
                    if '</MapView>' in lines[j]:
                        depth -= 1
                        if depth == 0:
                            j += 1
                            break
                    j += 1
                new_lines.append('      ) : (')
                new_lines.append('        <MapFallback style={styles.map} />')
                new_lines.append('      )}')
                i = j
            else:
                new_lines.append(line)
                i += 1
        
        result2 = '\n'.join(new_lines)
        if result2 != content:
            with open("app/tracking.tsx", "w", encoding="utf-8") as f:
                f.write(result2)
            print("tracking.tsx: MapView atualizado (abordagem alternativa)!")
        else:
            print("tracking.tsx: FALHOU - nenhuma substituição feita")

def fix_run_summary():
    with open("app/run-summary.tsx", "r", encoding="utf-8") as f:
        content = f.read()

    pattern = r'(\s+)<MapView(.*?)</MapView>'
    
    new_block = r'''\1{Platform.OS !== "web" && MapView ? (
\1  <MapView\2</MapView>
\1) : (
\1  <MapFallback style={styles.routeMap} />
\1)}'''
    
    result = re.sub(pattern, new_block, content, flags=re.DOTALL)
    
    if result != content:
        with open("app/run-summary.tsx", "w", encoding="utf-8") as f:
            f.write(result)
        print("run-summary.tsx: MapView atualizado com fallback!")
    else:
        print("run-summary.tsx: padrão não encontrado")

fix_tracking()
fix_run_summary()
print("Concluído!")
