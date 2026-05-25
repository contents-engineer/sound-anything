// lib/options.ts
import type { SectionKey } from '@/types'

export type Preset = { emoji: string; label: string }

export type SectionMeta = {
  key: SectionKey
  number: number
  emoji: string
  title: string
  subtitle: string
  placeholder: string
  multi: boolean
  presets: Preset[]
}

export const GENRES: Preset[] = [
  { emoji: '🎹', label: '시티팝(City Pop)' },
  { emoji: '🎧', label: '로파이(Lo-fi)' },
  { emoji: '🌊', label: '칠웨이브' },
  { emoji: '🎸', label: 'K-록' },
  { emoji: '👥', label: '합창/중창' },
  { emoji: '🧘', label: '명상/치유' },
  { emoji: '✝️', label: 'CCM/찬양' },
  { emoji: '💫', label: 'K-pop' },
  { emoji: '💔', label: '발라드' },
  { emoji: '🎺', label: '재즈' },
  { emoji: '🎤', label: '팝' },
  { emoji: '🎵', label: '힙합' },
  { emoji: '🌌', label: '뉴에이지' },
  { emoji: '🌫️', label: '앰비언트' },
  { emoji: '🎶', label: '트로트' },
  { emoji: '🎷', label: '블루스' },
  { emoji: '🤠', label: '컨트리' },
  { emoji: '🪕', label: '포크' },
  { emoji: '🏝️', label: '레게' },
  { emoji: '✨', label: '디스코' },
  { emoji: '🎸', label: '록' },
  { emoji: '🔊', label: '전자음악' },
  { emoji: '🎼', label: 'R&B' },
  { emoji: '🎹', label: '소울' },
  { emoji: '🎛️', label: '신스팝' },
  { emoji: '☁️', label: '드림 팝' },
  { emoji: '🎨', label: '인디팝' },
  { emoji: '🙏', label: '가스펠' },
  { emoji: '🎺', label: '스윙' },
  { emoji: '💃', label: '라틴' },
  { emoji: '🎵', label: '이지리스닝' },
  { emoji: '👶', label: '자장가' },
  { emoji: '🧸', label: '동요' },
  { emoji: '🎄', label: '캐롤' },
]

export const MOODS: Preset[] = [
  { emoji: '🌙', label: '잔잔한 (고요한)' },
  { emoji: '😢', label: '깊은 슬픔' },
  { emoji: '🌃', label: '우울한 새벽' },
  { emoji: '🙏', label: '경건하고 은혜로운' },
  { emoji: '🤗', label: '따스한 위로' },
  { emoji: '☮️', label: '순수한 평화' },
  { emoji: '☁️', label: '포근한 구름' },
  { emoji: '⚡', label: '에너지 폭발' },
  { emoji: '💕', label: '로맨틱 감성' },
  { emoji: '🌅', label: '일몰같은' },
  { emoji: '🌌', label: '우주 같은' },
  { emoji: '🖤', label: '다크하고 강렬' },
  { emoji: '🍃', label: '시원한 바람' },
  { emoji: '🚗', label: '강력한 드라이브' },
  { emoji: '💪', label: '도전적인' },
  { emoji: '🏔️', label: '웅장한 대서사시' },
  { emoji: '🥰', label: '귀여운' },
]

export const VOCALS: Preset[] = [
  { emoji: '👶', label: '어린이 합창단' },
  { emoji: '👥', label: '어른 합창단' },
  { emoji: '👩', label: '맑고 깨끗한 여성 보컬' },
  { emoji: '✨', label: '에테리얼 여성 보컬' },
  { emoji: '💕', label: '로맨틱 여성 보컬' },
  { emoji: '🎙️', label: '허스키 남성 보컬' },
  { emoji: '👦', label: '소년 보컬' },
  { emoji: '👧', label: '맑은 소녀 보컬' },
  { emoji: '🔥', label: '열정적인 남성 보컬' },
  { emoji: '🎵', label: '남녀 코러스 합창' },
  { emoji: '🤖', label: '보코더 효과' },
  { emoji: '🤫', label: '속삭이는 여성' },
  { emoji: '🎤', label: '랩 (남성)' },
  { emoji: '🎤', label: '랩 (여성)' },
  { emoji: '🎭', label: '오페라틱 (남성)' },
  { emoji: '🎭', label: '오페라틱 (여성)' },
  { emoji: '🌬️', label: '공기반 사운드반' },
  { emoji: '🎼', label: '가사없는 연주곡' },
]

export const USAGES: Preset[] = [
  { emoji: '📹', label: '유튜브 브이로그 BGM' },
  { emoji: '🎮', label: '게임 방송 배경음' },
  { emoji: '📚', label: '공부/집중력 향상' },
  { emoji: '💪', label: '운동/피트니스' },
  { emoji: '😴', label: '숙면/명상' },
  { emoji: '☕', label: '카페 분위기' },
  { emoji: '📱', label: '감성 쇼츠/틱톡' },
  { emoji: '⛪', label: '교회 예배/묵상' },
]

export const INSTRUMENTS: Preset[] = [
  { emoji: '🎹', label: '그랜드 피아노' },
  { emoji: '🎸', label: '어쿠스틱 기타' },
  { emoji: '⚡', label: '일렉 기타' },
  { emoji: '🎵', label: '오르골' },
  { emoji: '🎷', label: '색소폰' },
  { emoji: '🎻', label: '바이올린' },
  { emoji: '🎻', label: '첼로' },
  { emoji: '🔔', label: '싱잉볼' },
  { emoji: '🎛️', label: '신디사이저' },
]

export const BPMS: Preset[] = [
  { emoji: '😴', label: '초저속 (40-50 BPM)' },
  { emoji: '🌙', label: '매우 느림 (50-70 BPM)' },
  { emoji: '🧘', label: '느림 (70-90 BPM)' },
  { emoji: '🚶', label: '보통 (90-110 BPM)' },
  { emoji: '😊', label: '약간 빠름 (110-130 BPM)' },
  { emoji: '🏃', label: '빠름 (130-150 BPM)' },
  { emoji: '💪', label: '매우 빠름 (150-170 BPM)' },
  { emoji: '⚡', label: '초고속 (170+ BPM)' },
]

export const AGES: Preset[] = [
  { emoji: '👶', label: '유아 (0-7세)' },
  { emoji: '🎒', label: '10대 (청소년)' },
  { emoji: '💼', label: '20대 (청춘)' },
  { emoji: '👔', label: '30-40대 (직장인/부모)' },
  { emoji: '🎩', label: '50-60대 (시니어)' },
  { emoji: '🌍', label: '전 연령대' },
]

export const LANGUAGES: Preset[] = [
  { emoji: '🇰🇷', label: '한국어' },
  { emoji: '🇺🇸', label: '영어' },
  { emoji: '🌏', label: '한국어+영어 섞어서' },
]

export const TOPICS: Preset[] = [
  { emoji: '💕', label: '첫사랑' },
  { emoji: '👶', label: '자장가' },
  { emoji: '🌅', label: '새벽 묵상' },
  { emoji: '💔', label: '이별의 아픔' },
  { emoji: '🤝', label: '재회' },
  { emoji: '😊', label: '짝사랑' },
  { emoji: '💪', label: '자기 사랑' },
  { emoji: '🔥', label: '용기' },
  { emoji: '✨', label: '갓생' },
  { emoji: '👤', label: '주체적 나' },
  { emoji: '🎯', label: '실패와 극복' },
  { emoji: '💎', label: '자신감 회복' },
  { emoji: '🏠', label: '향수' },
  { emoji: '🌧️', label: '비 오는 날' },
  { emoji: '✈️', label: '여행' },
  { emoji: '🙏', label: '감사와 기도' },
  { emoji: '🎼', label: '가사없는(연주곡)' },
  { emoji: '🎄', label: '크리스마스' },
]

export const SECTIONS: SectionMeta[] = [
  { key: 'genre',      number: 1, emoji: '🎸', title: '장르 선택',        subtitle: '음악의 색깔',     placeholder: '원하는 장르를 직접 입력하세요',          multi: true,  presets: GENRES },
  { key: 'mood',       number: 2, emoji: '✨', title: '분위기 및 감성',    subtitle: '감정의 깊이',     placeholder: '원하는 분위기를 직접 입력하세요',        multi: true,  presets: MOODS },
  { key: 'vocal',      number: 3, emoji: '🎤', title: '보컬 및 창법',      subtitle: '목소리의 질감',   placeholder: '원하는 보컬 스타일을 직접 입력하세요',   multi: true,  presets: VOCALS },
  { key: 'usage',      number: 4, emoji: '🎬', title: '사용 용도',         subtitle: '공간의 울림',     placeholder: '사용 용도를 직접 입력하세요',            multi: true,  presets: USAGES },
  { key: 'instrument', number: 5, emoji: '🎹', title: '주요 악기',         subtitle: '소리의 도구',     placeholder: '원하는 악기를 직접 입력하세요',          multi: true,  presets: INSTRUMENTS },
  { key: 'bpm',        number: 6, emoji: '⚡', title: '속도 (BPM)',        subtitle: '리듬의 맥박',     placeholder: '원하는 BPM을 직접 입력하세요',           multi: false, presets: BPMS },
  { key: 'age',        number: 7, emoji: '👥', title: '타겟 연령대',       subtitle: '청중의 공감',     placeholder: '타겟 연령대를 직접 입력하세요',          multi: false, presets: AGES },
  { key: 'language',   number: 8, emoji: '🌐', title: '가사 언어',         subtitle: '글로벌 소통',     placeholder: '원하는 언어를 직접 입력하세요',          multi: false, presets: LANGUAGES },
  { key: 'topic',      number: 9, emoji: '📝', title: '가사 주제 및 요청', subtitle: '창작의 핵심',     placeholder: '원하는 가사 주제나 요청사항을 자유롭게 입력하세요', multi: true, presets: TOPICS },
]
