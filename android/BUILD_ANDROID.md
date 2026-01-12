# Como Gerar o APK (Android)

O projeto está configurado para Android com Capacitor, mas seu ambiente atual parece estar usando **Java 8**, e o Android requer **Java 17** (ou no mínimo 11).

## Pré-requisitos
1.  **Android Studio** instalado (inclui o SDK e JDK corretos).
2.  **Java JDK 17** (caso não use o do Android Studio).

## Passo a Passo para Gerar APK

### Opção 1: Via Android Studio (Recomendado)
A maneira mais fácil e visual.

1.  Abra o **Android Studio**.
2.  Selecione **Open Project** e escolha a pasta `android` dentro do projeto `motojá`.
3.  Aguarde a sincronização (Gradle Sync).
4.  No menu superior, vá em **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
5.  O APK será gerado em: `android/app/build/outputs/apk/debug/app-debug.apk`.

### Opção 2: Via Linha de Comando
Se você tiver o Java 17 configurado no terminal:

```bash
# Sincronizar código web para nativo
npx cap sync android

# Entrar na pasta android e buildar
cd android
./gradlew assembleDebug
```

## Solução de Problemas
- **Erro de Java**: Se der erro de versão do Java, certifique-se de que a variável de ambiente `JAVA_HOME` aponta para o JDK 17.
- **Erro de SDK**: Abra o Android Studio pelo menos uma vez para aceitar as licenças e baixar o SDK Platform.
