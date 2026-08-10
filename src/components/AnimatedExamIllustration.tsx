import React from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Path,
  Rect,
  Circle,
  Line,
  G,
  Text as SvgText,
} from "react-native-svg";

interface AnimatedExamIllustrationProps {
  isFormActive?: boolean;
}

export function AnimatedExamIllustration({ isFormActive = false }: AnimatedExamIllustrationProps) {
  const { width } = useWindowDimensions();

  // Dynamic responsive maxHeight scaling
  const maxIllustrationHeight = width < 360 ? 150 : width > 600 ? 300 : 220;

  return (
    <View style={[styles.container, { maxHeight: maxIllustrationHeight }]}>
      <Svg viewBox="0 0 800 600" style={styles.svg}>
        <Defs>
          <LinearGradient id="sandGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FDB813" />
            <Stop offset="100%" stopColor="#FFC83B" />
          </LinearGradient>
          <LinearGradient id="clipboardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="#F8FAFC" />
          </LinearGradient>
        </Defs>

        {/* 1. ROTATING GEARS IN BACKGROUND */}
        <G id="background-gears">
          {/* Large Gear Top Center */}
          <Path
            d="M340 70 L346 82 A40 40 0 0 1 358 87 L371 84 L377 95 L366 104 A40 40 0 0 1 368 118 L380 123 L377 136 L363 134 A40 40 0 0 1 354 143 L358 156 L345 160 L338 148 A40 40 0 0 1 324 146 L313 154 L305 143 L315 132 A40 40 0 0 1 312 118 L299 115 L301 101 L314 102 A40 40 0 0 1 323 92 L317 79 L329 73 L338 83 A40 40 0 0 1 340 70 Z"
            fill="#E2E8F0"
          />
          <Circle cx="340" cy="110" r="18" fill="#E2E8F0" />
          <Circle cx="340" cy="110" r="10" fill="#F8FAFC" />

          {/* Medium Gear Left Center */}
          <Path
            d="M90 290 L94 299 A30 30 0 0 1 103 303 L113 300 L117 309 L109 316 A30 30 0 0 1 110 327 L119 331 L116 340 L105 338 A30 30 0 0 1 98 345 L101 355 L91 358 L86 349 A30 30 0 0 1 76 347 L67 353 L61 344 L69 336 A30 30 0 0 1 67 325 L57 323 L59 312 L69 313 A30 30 0 0 1 76 305 L71 295 L80 291 L87 299 A30 30 0 0 1 90 290 Z"
            fill="#E2E8F0"
          />
          <Circle cx="90" cy="320" r="12" fill="#F8FAFC" />

          {/* Small Gear Right Top */}
          <Circle cx="640" cy="170" r="22" stroke="#CBD5E1" strokeWidth="6" strokeDasharray="6 4" fill="none" />
          <Circle cx="640" cy="170" r="8" fill="#E2E8F0" />
        </G>

        {/* 2. SPARKLES / STARS */}
        <G id="sparkles">
          {/* Green Star Top Left */}
          <Path
            d="M60 180 Q60 195 45 195 Q60 195 60 210 Q60 195 75 195 Q60 195 60 180 Z"
            fill="#22C55E"
          />

          {/* Indigo Star Top Middle */}
          <Path
            d="M260 100 Q260 110 250 110 Q260 110 260 120 Q260 110 270 110 Q260 110 260 100 Z"
            fill="#4F46E5"
          />

          {/* Orange Star Right Side */}
          <Path
            d="M710 270 Q710 282 698 282 Q710 282 710 294 Q710 282 722 282 Q710 282 710 270 Z"
            fill="#F96D41"
          />
        </G>

        {/* 3. CLIPBOARD / TEST SHEET */}
        <G id="clipboard">
          <Rect x="315" y="75" width="260" height="425" rx="16" fill="#CBD5E1" opacity={0.4} />
          <Rect x="310" y="70" width="260" height="420" rx="16" fill="url(#clipboardGrad)" stroke="#E2E8F0" strokeWidth="4" />

          {/* Orange Top Header Band */}
          <Rect x="310" y="70" width="260" height="36" rx="12" fill="#F96D41" />
          {/* Dark Clip Handle */}
          <Rect x="380" y="60" width="120" height="22" rx="6" fill="#22242A" />
          <Rect x="390" y="66" width="100" height="10" rx="3" fill="#F96D41" />

          <Circle cx="340" cy="130" r="10" fill="#E2E8F0" />
          <Rect x="360" y="126" width="90" height="8" rx="4" fill="#CBD5E1" />

          {/* Checkboxes Row 1 */}
          <G id="checkbox-yellow">
            <Rect x="340" y="160" width="40" height="40" rx="8" fill="#FFC83B" />
            <Path d="M350 180 L357 187 L371 171" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          </G>
          <Rect x="395" y="172" width="130" height="8" rx="4" fill="#CBD5E1" />
          <Rect x="395" y="186" width="85" height="6" rx="3" fill="#E2E8F0" />

          <G id="checkbox-green">
            <Rect x="470" y="160" width="40" height="40" rx="8" fill="#00B887" />
            <Path d="M480 180 L487 187 L501 171" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          </G>

          <Line x1="335" y1="225" x2="545" y2="225" stroke="#F1F5F9" strokeWidth="3" strokeLinecap="round" />

          {/* Growth Bar Chart Section */}
          <G id="chart">
            <Rect x="340" y="300" width="22" height="60" rx="4" fill="#E2E8F0" />
            <Rect x="372" y="270" width="22" height="90" rx="4" fill="#CBD5E1" />
            <Rect x="404" y="310" width="22" height="50" rx="4" fill="#E2E8F0" />
            <Rect x="436" y="250" width="22" height="110" rx="4" fill="#00B887" opacity={0.85} />
            <Rect x="468" y="290" width="22" height="70" rx="4" fill="#CBD5E1" />

            <G id="chart-arrow">
              <Path
                d="M400 270 L450 230 L475 242 L510 200"
                stroke="#FFC83B" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"
              />
              <Path d="M490 200 L510 200 L510 220" stroke="#FFC83B" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
            </G>
          </G>
        </G>

        {/* 4. GREEN CHECKMARK SPEECH BADGE (TOP RIGHT) */}
        <G id="checkmark-badge">
          <Circle cx="635" cy="115" r="40" fill="#00B887" />
          <Path d="M600 135 L585 155 L615 145 Z" fill="#00B887" />
          <Circle cx="635" cy="115" r="33" stroke="#FFFFFF" strokeWidth="3" fill="none" opacity={0.4} />
          <Path
            d="M617 115 L629 127 L653 103"
            stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"
          />
        </G>

        {/* 5. HOURGLASS (RIGHT SIDE) */}
        <G id="hourglass">
          <Rect x="525" y="240" width="135" height="18" rx="6" fill="#F96D41" />
          <Rect x="525" y="440" width="135" height="18" rx="6" fill="#F96D41" />

          <Rect x="537" y="258" width="8" height="182" rx="3" fill="#22242A" />
          <Rect x="642" y="258" width="8" height="182" rx="3" fill="#22242A" />

          <Path
            d="M545 258 C545 310 580 340 592 349 C605 340 640 310 640 258 Z"
            fill="#FFFFFF" opacity={0.6} stroke="#22242A" strokeWidth="4"
          />
          <Path
            d="M545 440 C545 388 580 358 592 349 C605 358 640 388 640 440 Z"
            fill="#FFFFFF" opacity={0.6} stroke="#22242A" strokeWidth="4"
          />

          <Path
            d="M552 270 C552 310 580 335 592 345 C605 335 632 310 632 270 Z"
            fill="url(#sandGradient)"
          />

          <Line
            x1="592" y1="345" x2="592" y2="425"
            stroke="#FFC83B" strokeWidth="4" strokeLinecap="round" strokeDasharray="6 4"
          />

          <Path
            d="M555 435 C565 405 585 395 592 395 C600 395 620 405 630 435 Z"
            fill="url(#sandGradient)"
          />
        </G>

        {/* 6. GREEN BINDER BLOCK ON FLOOR */}
        <G id="binder">
          <Rect x="250" y="490" width="240" height="50" rx="8" fill="#00B887" />
          <Rect x="330" y="502" width="40" height="10" rx="2" fill="#FFFFFF" />
          <Rect x="330" y="518" width="40" height="10" rx="2" fill="#FFFFFF" />
        </G>

        {/* 7. STANDING AVATAR (CRYING/SAD BY DEFAULT vs HAPPY/POINTING WHEN FORM ACTIVE) */}
        <G id="standing-character">
          {/* STANDING LEGS (INDIGO #4F46E5) */}
          <Path d="M 125 350 L 105 530" stroke="#4F46E5" strokeWidth="32" strokeLinecap="round" />
          <Path d="M 120 350 L 100 530" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="5 5" opacity={0.8} />
          
          <Path d="M 175 350 L 175 530" stroke="#4F46E5" strokeWidth="32" strokeLinecap="round" />
          <Path d="M 170 350 L 170 530" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="5 5" opacity={0.8} />

          {/* SHOES (DARK SLATE #1E293B FLAT ON FLOOR) */}
          <Path d="M 75 530 L 125 530 L 130 550 L 65 550 Z" fill="#1E293B" />
          <Rect x="65" y="546" width="65" height="8" rx="2" fill="#FFFFFF" />

          <Path d="M 150 530 L 200 530 L 205 550 L 140 550 Z" fill="#1E293B" />
          <Rect x="140" y="546" width="65" height="8" rx="2" fill="#FFFFFF" />

          {/* TORSO (BRIGHT GREEN SHIRT #4ADE80) */}
          <Path d="M 110 200 L 190 200 L 185 360 L 105 360 Z" fill="#4ADE80" />
          <Path d="M 125 200 L 135 290" stroke="#22C55E" strokeWidth="2.5" />
          <Path d="M 175 200 L 165 300" stroke="#22C55E" strokeWidth="2.5" />

          {/* LAPTOP HELD IN LEFT ARM */}
          <Path d="M 115 220 L 85 290 L 155 310" stroke="#4ADE80" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M 155 310 L 170 310" stroke="#FDBA74" strokeWidth="12" strokeLinecap="round" />

          {/* RIGHT ARM & HAND:
              - When isFormActive = false: Resting/holding laptop
              - When isFormActive = true: POINTING REACHING TOWARDS LOGIN FORM!
          */}
          {isFormActive ? (
            <G id="pointing-arm-active">
              <Path d="M 185 210 L 265 180" stroke="#4ADE80" strokeWidth="22" strokeLinecap="round" />
              <Path d="M 265 180 L 290 170" stroke="#FDBA74" strokeWidth="12" strokeLinecap="round" />
            </G>
          ) : (
            <G id="resting-arm-idle">
              <Path d="M 185 220 L 225 285 L 185 310" stroke="#4ADE80" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
              <Path d="M 185 310 L 195 315" stroke="#FDBA74" strokeWidth="12" strokeLinecap="round" />
            </G>
          )}

          {/* LAPTOP WITH SCREEN DISPLAY */}
          <G id="laptop-device">
            <Path d="M 240 305 L 180 240 L 188 234 L 248 299 Z" fill="#22242A" />
            <Path d="M 235 303 L 182 244 L 176 250 L 229 307 Z" fill="#38BDF8" />
            <Path d="M 225 298 L 186 252 L 182 256 L 221 302 Z" fill="#7DD3FC" />
            <Path d="M 180 248 L 230 300 L 155 210 Z" fill="#38BDF8" opacity={0.25} />
            <Rect x="145" y="300" width="95" height="12" rx="4" fill="#22242A" />
          </G>

          {/* HEAD & DYNAMIC FACE EXPRESSION */}
          <G id="avatar-head">
            {/* Neck */}
            <Rect x="140" y="165" width="22" height="38" fill="#FDBA74" />
            {/* Head */}
            <Circle cx="150" cy="140" r="28" fill="#FDBA74" />
            {/* Ears */}
            <Circle cx="122" cy="140" r="6" fill="#FDBA74" />
            <Circle cx="178" cy="140" r="6" fill="#FDBA74" />
            {/* Nose */}
            <Path d="M 152 138 L 158 143 L 152 145" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

            {/* DYNAMIC FACE EXPRESSION:
                - isFormActive = false -> SAD & CRYING (downward curved mouth, droopy eyebrows, teardrop on cheek)
                - isFormActive = true -> HAPPY & EXCITED (open smile, happy eyes, no tears)
            */}
            {isFormActive ? (
              /* HAPPY & EXCITED MODE */
              <G id="happy-face">
                <Path d="M 142 150 C 142 165 164 165 164 150 Z" fill="#EF4444" stroke="#1E293B" strokeWidth="1.5" />
                <Path d="M 136 136 L 142 130 L 136 124" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <Path d="M 164 136 L 158 130 L 164 124" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </G>
            ) : (
              /* SAD & CRYING MODE */
              <G id="crying-sad-face">
                {/* Sad Downward Mouth */}
                <Path d="M 142 158 Q 153 148 164 158" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                {/* Sad Droopy Eyebrows / Eyes */}
                <Path d="M 136 130 Q 142 136 148 132" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />
                <Circle cx="142" cy="136" r="3" fill="#1E293B" />

                <Path d="M 158 132 Q 164 136 170 130" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />
                <Circle cx="164" cy="136" r="3" fill="#1E293B" />

                {/* Sad Teardrop on cheek */}
                <Circle cx="168" cy="146" r="3" fill="#38BDF8" />
                <Path d="M 168 142 L 166 145 L 170 145 Z" fill="#38BDF8" />
              </G>
            )}

            {/* Indigo Hair (#4F46E5) */}
            <Path
              d="M 120 125 C 120 85 180 85 175 125 C 185 130 165 142 155 136 Z"
              fill="#4F46E5"
            />
          </G>
        </G>

        {/* 8. "EXAM" SPEECH BUBBLE */}
        <G id="exam-bubble">
          <Rect x="155" y="80" width="115" height="58" rx="16" fill="#00B887" />
          <Path d="M 205 138 L 215 155 L 225 138 Z" fill="#00B887" />
          <SvgText
            x="212"
            y="118"
            fill="#FFFFFF"
            fontSize="22"
            fontWeight="900"
            textAnchor="middle"
          >
            Exam
          </SvgText>
        </G>

        {/* Floor Accent Lines */}
        <Line x1="40" y1="550" x2="760" y2="550" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
        <Line x1="120" y1="570" x2="240" y2="570" stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" />
        <Line x1="480" y1="570" x2="620" y2="570" stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    aspectRatio: 4 / 3,
    maxHeight: 240,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
  },
  svg: {
    width: "100%",
    height: "100%",
  },
});
