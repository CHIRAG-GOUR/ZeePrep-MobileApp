import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Dimensions,
  Easing,
  Platform,
} from "react-native";
import { createAudioPlayer } from "expo-audio";

const { width } = Dimensions.get("window");

// In-memory cold launch state (resets only on process exit)
let hasPlayedColdLaunch = false;

interface ZeePrepLaunchScreenProps {
  onComplete: () => void;
}

export function ZeePrepLaunchScreen({ onComplete }: ZeePrepLaunchScreenProps) {
  const [isDone, setIsDone] = useState(false);

  // Animation values
  const bgGlowScale = useRef(new Animated.Value(0.6)).current;
  const bgGlowOpacity = useRef(new Animated.Value(0.1)).current;
  const logoScale = useRef(new Animated.Value(0.75)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const wordmarkOpacity = useRef(new Animated.Value(0)).current;
  const wordmarkTranslateY = useRef(new Animated.Value(18)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(10)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  // Audio references
  const musicPlayerRef = useRef<any>(null);
  const voicePlayerRef = useRef<any>(null);

  useEffect(() => {
    // If Web platform or warm launch, skip immediately
    if (Platform.OS === "web" || hasPlayedColdLaunch) {
      onComplete();
      return;
    }
    hasPlayedColdLaunch = true;

    let isMounted = true;
    let fadeOutStarted = false;
    let voiceHasStarted = false;
    let musicHasStarted = false;
    let voiceDone = false;
    let musicDone = false;

    // Helper: Safely fade out audio and trigger screen transition
    const finishLaunchSequence = () => {
      if (fadeOutStarted || !isMounted) return;
      fadeOutStarted = true;

      // Smoothly fade screen
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 600,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        if (!isMounted) return;
        cleanupAudio();
        setIsDone(true);
        onComplete();
      });
    };

    // Cleanup helper
    const cleanupAudio = () => {
      try {
        if (musicPlayerRef.current) {
          musicPlayerRef.current.pause();
          musicPlayerRef.current.remove();
          musicPlayerRef.current = null;
        }
        if (voicePlayerRef.current) {
          voicePlayerRef.current.pause();
          voicePlayerRef.current.remove();
          voicePlayerRef.current = null;
        }
      } catch (e) {
        // Ignored
      }
    };

    // Step 1: Start Visual Animation
    Animated.parallel([
      Animated.timing(bgGlowScale, {
        toValue: 1.25,
        duration: 1600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(bgGlowOpacity, {
        toValue: 0.45,
        duration: 1400,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1.0,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1.0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(wordmarkOpacity, {
        toValue: 1.0,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(wordmarkTranslateY, {
        toValue: 0,
        duration: 900,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(taglineOpacity, {
        toValue: 1.0,
        duration: 1100,
        useNativeDriver: true,
      }),
      Animated.timing(taglineTranslateY, {
        toValue: 0,
        duration: 1100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Step 2: Initialize Audio & Monitor Dual Audio Completion
    const setupAudioAndSync = async () => {
      try {
        const musicSource = require("../../assets/Intro Music 1.mp3");
        const voiceSource = require("../../assets/Intro.mp3");

        const musicPlayer = createAudioPlayer(musicSource);
        const voicePlayer = createAudioPlayer(voiceSource);

        musicPlayerRef.current = musicPlayer;
        voicePlayerRef.current = voicePlayer;

        // 0.15s: Start Intro Voice sound ("ZeePrep — Learn. Practice. Perform.") at loud volume (1.0)
        setTimeout(() => {
          if (!isMounted) return;
          try {
            voicePlayer.volume = 1.0;
            voicePlayer.play();
            voiceHasStarted = true;
          } catch (e) {
            console.warn("Voice play notice:", e);
          }
        }, 150);

        // 0.8s: Start Intro Music at soft background volume (0.25) to harmonize with the voiceover
        setTimeout(() => {
          if (!isMounted) return;
          try {
            musicPlayer.volume = 0.125;
            musicPlayer.play();
            musicHasStarted = true;
          } catch (e) {
            console.warn("Music play notice:", e);
          }
        }, 800);

        // Dual Audio Poller: Waits for BOTH Intro Voice AND Intro Music to complete 100% naturally
        const pollInterval = setInterval(() => {
          if (!isMounted) {
            clearInterval(pollInterval);
            return;
          }

          try {
            // Monitor Voice Status
            if (voicePlayer && voiceHasStarted) {
              const vPlaying = Boolean(voicePlayer.playing);
              const vCur = voicePlayer.currentTime || 0;
              const vDur = voicePlayer.duration || 0;
              if (!vPlaying || (vDur > 0 && vCur >= vDur - 0.2)) {
                voiceDone = true;
              }
            }

            // Monitor Music Status
            if (musicPlayer && musicHasStarted) {
              const mPlaying = Boolean(musicPlayer.playing);
              const mCur = musicPlayer.currentTime || 0;
              const mDur = musicPlayer.duration || 0;
              if (!mPlaying || (mDur > 0 && mCur >= mDur - 0.2)) {
                musicDone = true;
              }
            }

            // Only trigger transition once BOTH audios have finished completely
            if (voiceDone && musicDone) {
              clearInterval(pollInterval);
              setTimeout(() => {
                if (isMounted) finishLaunchSequence();
              }, 400);
            }
          } catch (e) {
            // Ignored
          }
        }, 150);

        // Safety max timeout (9.5s) to guarantee app transition if device audio service locks
        setTimeout(() => {
          if (isMounted && !fadeOutStarted) {
            finishLaunchSequence();
          }
        }, 9500);
      } catch (err) {
        console.warn("Launch audio setup notice:", err);
        setTimeout(() => {
          if (isMounted && !fadeOutStarted) {
            finishLaunchSequence();
          }
        }, 4500);
      }
    };

    setupAudioAndSync();

    return () => {
      isMounted = false;
      cleanupAudio();
    };
  }, []);

  if (isDone) return null;

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      {/* Radial Light Ambient Glow */}
      <Animated.View
        style={[
          styles.glowCircle,
          {
            transform: [{ scale: bgGlowScale }],
            opacity: bgGlowOpacity,
          },
        ]}
      />

      <View style={styles.brandLockupContainer}>
        {/* Logo Badge with Distinctive Z Symbol */}
        <Animated.View
          style={[
            styles.logoBadge,
            {
              transform: [{ scale: logoScale }],
              opacity: logoOpacity,
            },
          ]}
        >
          <View style={styles.zCapShape}>
            {/* Graduation Cap Top Diamond */}
            <View style={styles.capDiamond} />
            {/* Z Top Bar */}
            <View style={styles.zTopBar} />
            {/* Z Diagonal */}
            <View style={styles.zDiagonal} />
            {/* Z Bottom Bar */}
            <View style={styles.zBottomBar} />
          </View>
        </Animated.View>

        {/* Brand Name "ZeePrep" */}
        <Animated.View
          style={{
            opacity: wordmarkOpacity,
            transform: [{ translateY: wordmarkTranslateY }],
            alignItems: "center",
          }}
        >
          <Text style={styles.brandTitle}>ZeePrep</Text>
        </Animated.View>

        {/* Tagline "Learn. Practice. Perform." */}
        <Animated.View
          style={{
            opacity: taglineOpacity,
            transform: [{ translateY: taglineTranslateY }],
            alignItems: "center",
            marginTop: 10,
          }}
        >
          <Text style={styles.taglineText}>Learn. Practice. Perform.</Text>
          <View style={styles.accentDivider} />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 99999,
  },
  glowCircle: {
    position: "absolute",
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: (width * 0.85) / 2,
    backgroundColor: "#DBEAFE",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 50,
    elevation: 10,
  },
  brandLockupContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logoBadge: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 22,
    borderWidth: 1.5,
    borderColor: "#60A5FA",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  zCapShape: {
    width: 48,
    height: 48,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  capDiamond: {
    position: "absolute",
    top: 2,
    width: 14,
    height: 14,
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "45deg" }],
  },
  zTopBar: {
    position: "absolute",
    top: 14,
    left: 4,
    right: 4,
    height: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 3,
  },
  zDiagonal: {
    position: "absolute",
    width: 42,
    height: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 3,
    transform: [{ rotate: "-45deg" }],
  },
  zBottomBar: {
    position: "absolute",
    bottom: 6,
    left: 4,
    right: 4,
    height: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 3,
  },
  brandTitle: {
    fontSize: 42,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
    textShadowColor: "rgba(37, 99, 235, 0.15)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  taglineText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1D4ED8",
    letterSpacing: 2.2,
    textTransform: "uppercase",
  },
  accentDivider: {
    width: 44,
    height: 3.5,
    backgroundColor: "#2563EB",
    borderRadius: 2,
    marginTop: 12,
  },
});
