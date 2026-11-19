import type { Problem } from '../types/problem'

export const INITIAL_PROBLEMS: Problem[] = [
  {
    id: 'p-1',
    title: '兩數之和 (Two Sum)',
    platform: 'LeetCode',
    difficulty: 'easy',
    status: 'solved',
    tags: ['Array', 'Hash Table'],
    notes: '經典題目！面試時先給暴力解（O(N^2)），再提出 Hash Map 查表解法（O(N)），能展現出優化思維。',
    startedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    versions: [
      {
        versionId: 'v-101',
        versionName: 'v1 - 雙重迴圈暴力法 (Brute Force)',
        code: `function twoSum(nums: number[], target: number): number[] {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
  return [];
}`,
        timeComplexity: 'O(N^2)',
        spaceComplexity: 'O(1)',
        aiSuggestion: '暴力法雖然不需要額外空間，但在陣列長度較大時效率不佳。建議可使用 Hash Map 記錄已訪問過的值與索引，將時間複雜度降至 O(N)。',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        versionId: 'v-102',
        versionName: 'v2 - Hash Map 查表優化 (Optimal)',
        code: `function twoSum(nums: number[], target: number): number[] {
  const map = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement)!, i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(N)',
        aiSuggestion: '完美最佳解！使用 Map 實現單趟掃描（One-pass），空間換取時間的典型範例。邊界狀況如重複元素也能妥善處理。',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      }
    ],
    comments: [
      {
        id: 'c-1',
        author: 'student',
        content: '老師，請問在 JS 中使用 new Map() 和直接用普通物件 {} 當 hash table 在性能與記憶體上有差別嗎？',
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
      },
      {
        id: 'c-2',
        author: 'teacher',
        content: '很棒的問題！若 key 是數字，`Map` 性能在頻繁增刪時通常更穩定，且不會有 Object 原型鏈污染問題；一般題目兩者皆可。你的 v2 優化架構非常漂亮！',
        createdAt: new Date(Date.now() - 3600000 * 1).toISOString()
      }
    ]
  },
  {
    id: 'p-2',
    title: '最長迴文子字串 (Longest Palindromic Substring)',
    platform: 'LeetCode',
    difficulty: 'medium',
    status: 'solving',
    tags: ['String', 'Dynamic Programming', 'Two Pointers'],
    notes: '中心擴散法（Expand Around Center）比二維 DP 矩陣更省空間，且比較直覺。',
    startedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    versions: [
      {
        versionId: 'v-201',
        versionName: 'v1 - 中心擴展雙指標法 (Expand Around Center)',
        code: `function longestPalindrome(s: string): string {
  if (s.length < 2) return s;
  let start = 0, maxLength = 1;

  function expand(left: number, right: number) {
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      const currentLength = right - left + 1;
      if (currentLength > maxLength) {
        maxLength = currentLength;
        start = left;
      }
      left--;
      right++;
    }
  }

  for (let i = 0; i < s.length; i++) {
    expand(i, i);     // 奇數長度中心
    expand(i, i + 1); // 偶數長度中心
  }

  return s.substring(start, start + maxLength);
}`,
        timeComplexity: 'O(N^2)',
        spaceComplexity: 'O(1)',
        aiSuggestion: '中心擴展法在空間複雜度上控制在 O(1)，相當優秀。如果還想挑戰極限，可以研究 Manacher演算法 (馬拉車演算法)，能做到 O(N) 線性時間複雜度！',
        createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      }
    ],
    comments: [
      {
        id: 'c-3',
        author: 'teacher',
        content: '注意邊界條件！字串為空或長度為 1 的防呆有寫好，很細心。',
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
      }
    ]
  },
  {
    id: 'p-3',
    title: '接雨水 (Trapping Rain Water)',
    platform: 'LeetCode',
    difficulty: 'hard',
    status: 'review',
    tags: ['Array', 'Two Pointers', 'Stack', 'Dynamic Programming'],
    notes: '雙指標解法需要特別注意 leftMax 和 rightMax 的邏輯更新順序。',
    startedAt: new Date(Date.now() - 3600000 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    versions: [
      {
        versionId: 'v-301',
        versionName: 'v1 - 雙指標夾擠法 (Two Pointers)',
        code: `function trap(height: number[]): number {
  let left = 0, right = height.length - 1;
  let leftMax = 0, rightMax = 0;
  let totalWater = 0;

  while (left < right) {
    if (height[left] < height[right]) {
      if (height[left] >= leftMax) {
        leftMax = height[left];
      } else {
        totalWater += leftMax - height[left];
      }
      left++;
    } else {
      if (height[right] >= rightMax) {
        rightMax = height[right];
      } else {
        totalWater += rightMax - height[right];
      }
      right--;
    }
  }

  return totalWater;
}`,
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(1)',
        aiSuggestion: '雙指標夾擠法是接雨水題目的最優解！空間只要 O(1)，程式碼邏輯清晰簡潔。',
        createdAt: new Date(Date.now() - 3600000 * 15).toISOString(),
      }
    ],
    comments: []
  }
]
