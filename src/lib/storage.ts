import { File, Paths } from "expo-file-system";
import { Platform } from "react-native";

/**
 * A few small text files kept on the phone: the last songbook downloaded, the
 * chosen language, the reading size. The browser preview keeps them in
 * localStorage instead, since it has no file system.
 */
export async function readText(name: string): Promise<string | null> {
  try {
    if (Platform.OS === "web") return globalThis.localStorage?.getItem(`hoziana:${name}`) ?? null;
    const file = new File(Paths.document, name);
    return file.exists ? await file.text() : null;
  } catch {
    return null;
  }
}

export async function writeText(name: string, value: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      globalThis.localStorage?.setItem(`hoziana:${name}`, value);
      return;
    }
    const file = new File(Paths.document, name);
    if (!file.exists) file.create();
    file.write(value);
  } catch {
    // Losing a saved preference is not worth interrupting anyone for; the app
    // still has the copy it is showing.
  }
}
