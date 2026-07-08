import colorsTokens from "../styles/tokens/colors.json";
import semanticTokens from "../styles/tokens/semantic.json";
import motionTokens from "../styles/tokens/motion.json";
import physicsTokens from "../styles/tokens/physics.json";
import orbTokens from "../styles/tokens/orb.json";
import faceTokens from "../styles/tokens/face.json";
import audioTokens from "../styles/tokens/audio.json";
import hapticsTokens from "../styles/tokens/haptics.json";
import accessibilityTokens from "../styles/tokens/accessibility.json";
import breakpointsTokens from "../styles/tokens/breakpoints.json";
import layersTokens from "../styles/tokens/layers.json";
import schemaTokens from "../styles/tokens/schema.json";
import spacingTokens from "../styles/tokens/spacing.json";

export class TokenLoader {
  public static getSpacing() {
    return spacingTokens;
  }
  public static getColors() {
    return colorsTokens;
  }

  public static getSemantic() {
    return semanticTokens;
  }

  public static getMotion() {
    return motionTokens;
  }

  public static getPhysics() {
    return physicsTokens;
  }

  public static getOrb() {
    return orbTokens;
  }

  public static getFace() {
    return faceTokens;
  }

  public static getAudio() {
    return audioTokens;
  }

  public static getHaptics() {
    return hapticsTokens;
  }

  public static getAccessibility() {
    return accessibilityTokens;
  }

  public static getBreakpoints() {
    return breakpointsTokens;
  }

  public static getLayers() {
    return layersTokens;
  }

  public static getSchema() {
    return schemaTokens;
  }
}
