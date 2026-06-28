import subprocess
import sys
import tempfile
import os

RECOMMENDED_QUESTIONS_DATA = {
    "Two Sum": {
        "difficulty": "Easy",
        "platform": "LeetCode",
        "python": {
            "starter_code": """class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        # Write your code here
        pass
""",
            "test_runner": """
sol = Solution()
assert sol.twoSum([2,7,11,15], 9) in [[0,1], [1,0]], f"Failed for [2,7,11,15], 9. Got {sol.twoSum([2,7,11,15], 9)}"
assert sol.twoSum([3,2,4], 6) in [[1,2], [2,1]], f"Failed for [3,2,4], 6. Got {sol.twoSum([3,2,4], 6)}"
assert sol.twoSum([3,3], 6) in [[0,1], [1,0]], f"Failed for [3,3], 6. Got {sol.twoSum([3,3], 6)}"
print("All test cases passed!")
"""
        },
        "javascript": {
            "starter_code": """/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
    // Write your code here
    
}
""",
            "test_runner": """
const assert = require('assert');
try {
    assert.deepStrictEqual(twoSum([2,7,11,15], 9).slice().sort(), [0,1]);
    assert.deepStrictEqual(twoSum([3,2,4], 6).slice().sort(), [1,2]);
    assert.deepStrictEqual(twoSum([3,3], 6).slice().sort(), [0,1]);
    console.log("All test cases passed!");
} catch (err) {
    console.error(err.message);
    process.exit(1);
}
"""
        }
    },
    "Valid Parentheses": {
        "difficulty": "Easy",
        "platform": "LeetCode",
        "python": {
            "starter_code": """class Solution:
    def isValid(self, s: str) -> bool:
        # Write your code here
        pass
""",
            "test_runner": """
sol = Solution()
assert sol.isValid("()") == True, "Failed for '()'"
assert sol.isValid("()[]{}") == True, "Failed for '()[]{}'"
assert sol.isValid("(]") == False, "Failed for '(]'"
assert sol.isValid("([)]") == False, "Failed for '([)]'"
assert sol.isValid("{[]}") == True, "Failed for '{[]}'"
print("All test cases passed!")
"""
        },
        "javascript": {
            "starter_code": """/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
    // Write your code here
    
}
""",
            "test_runner": """
const assert = require('assert');
try {
    assert.strictEqual(isValid("()"), true);
    assert.strictEqual(isValid("()[]{}"), true);
    assert.strictEqual(isValid("(]"), false);
    assert.strictEqual(isValid("([)]"), false);
    assert.strictEqual(isValid("{[]}"), true);
    console.log("All test cases passed!");
} catch (err) {
    console.error(err.message);
    process.exit(1);
}
"""
        }
    },
    "Merge Two Sorted Lists": {
        "difficulty": "Easy",
        "platform": "LeetCode",
        "python": {
            "starter_code": """# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next

class Solution:
    def mergeTwoLists(self, list1: ListNode, list2: ListNode) -> ListNode:
        # Write your code here
        pass
""",
            "test_runner": """
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def to_linked_list(arr):
    if not arr: return None
    head = ListNode(arr[0])
    curr = head
    for val in arr[1:]:
        curr.next = ListNode(val)
        curr = curr.next
    return head
    
def to_array(head):
    arr = []
    while head:
        arr.append(head.val)
        head = head.next
    return arr

sol = Solution()
assert to_array(sol.mergeTwoLists(to_linked_list([1,2,4]), to_linked_list([1,3,4]))) == [1,1,2,3,4,4], "Failed for [1,2,4] and [1,3,4]"
assert to_array(sol.mergeTwoLists(to_linked_list([]), to_linked_list([]))) == [], "Failed for empty lists"
assert to_array(sol.mergeTwoLists(to_linked_list([]), to_linked_list([0]))) == [0], "Failed for empty and [0]"
print("All test cases passed!")
"""
        },
        "javascript": {
            "starter_code": """/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} list1
 * @param {ListNode} list2
 * @return {ListNode}
 */
function mergeTwoLists(list1, list2) {
    // Write your code here
    
}
""",
            "test_runner": """
const assert = require('assert');
function ListNode(val, next) {
    this.val = (val===undefined ? 0 : val)
    this.next = (next===undefined ? null : next)
}
function toLinkedList(arr) {
    if (!arr.length) return null;
    let head = new ListNode(arr[0]);
    let curr = head;
    for (let i = 1; i < arr.length; i++) {
        curr.next = new ListNode(arr[i]);
        curr = curr.next;
    }
    return head;
}
function toArray(head) {
    let arr = [];
    while (head) {
        arr.push(head.val);
        head = head.next;
    }
    return arr;
}
try {
    assert.deepStrictEqual(toArray(mergeTwoLists(toLinkedList([1,2,4]), toLinkedList([1,3,4]))), [1,1,2,3,4,4]);
    assert.deepStrictEqual(toArray(mergeTwoLists(toLinkedList([]), toLinkedList([]))), []);
    assert.deepStrictEqual(toArray(mergeTwoLists(toLinkedList([]), toLinkedList([0]))), [0]);
    console.log("All test cases passed!");
} catch (err) {
    console.error(err.message);
    process.exit(1);
}
"""
        }
    },
    "Best Time to Buy and Sell Stock": {
        "difficulty": "Easy",
        "platform": "LeetCode",
        "python": {
            "starter_code": """class Solution:
    def maxProfit(self, prices: list[int]) -> int:
        # Write your code here
        pass
""",
            "test_runner": """
sol = Solution()
assert sol.maxProfit([7,1,5,3,6,4]) == 5, f"Failed for [7,1,5,3,6,4]. Got {sol.maxProfit([7,1,5,3,6,4])}"
assert sol.maxProfit([7,6,4,3,1]) == 0, f"Failed for [7,6,4,3,1]. Got {sol.maxProfit([7,6,4,3,1])}"
print("All test cases passed!")
"""
        },
        "javascript": {
            "starter_code": """/**
 * @param {number[]} prices
 * @return {number}
 */
function maxProfit(prices) {
    // Write your code here
    
}
""",
            "test_runner": """
const assert = require('assert');
try {
    assert.strictEqual(maxProfit([7,1,5,3,6,4]), 5);
    assert.strictEqual(maxProfit([7,6,4,3,1]), 0);
    console.log("All test cases passed!");
} catch (err) {
    console.error(err.message);
    process.exit(1);
}
"""
        }
    },
    "Reverse Linked List": {
        "difficulty": "Easy",
        "platform": "LeetCode",
        "python": {
            "starter_code": """# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next

class Solution:
    def reverseList(self, head: ListNode) -> ListNode:
        # Write your code here
        pass
""",
            "test_runner": """
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def to_linked_list(arr):
    if not arr: return None
    head = ListNode(arr[0])
    curr = head
    for val in arr[1:]:
        curr.next = ListNode(val)
        curr = curr.next
    return head
    
def to_array(head):
    arr = []
    while head:
        arr.append(head.val)
        head = head.next
    return arr

sol = Solution()
assert to_array(sol.reverseList(to_linked_list([1,2,3,4,5]))) == [5,4,3,2,1], "Failed for [1,2,3,4,5]"
assert to_array(sol.reverseList(to_linked_list([1,2]))) == [2,1], "Failed for [1,2]"
assert to_array(sol.reverseList(to_linked_list([]))) == [], "Failed for empty list"
print("All test cases passed!")
"""
        },
        "javascript": {
            "starter_code": """/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} head
 * @return {ListNode}
 */
function reverseList(head) {
    // Write your code here
    
}
""",
            "test_runner": """
const assert = require('assert');
function ListNode(val, next) {
    this.val = (val===undefined ? 0 : val)
    this.next = (next===undefined ? null : next)
}
function toLinkedList(arr) {
    if (!arr.length) return null;
    let head = new ListNode(arr[0]);
    let curr = head;
    for (let i = 1; i < arr.length; i++) {
        curr.next = new ListNode(arr[i]);
        curr = curr.next;
    }
    return head;
}
function toArray(head) {
    let arr = [];
    while (head) {
        arr.push(head.val);
        head = head.next;
    }
    return arr;
}
try {
    assert.deepStrictEqual(toArray(reverseList(toLinkedList([1,2,3,4,5]))), [5,4,3,2,1]);
    assert.deepStrictEqual(toArray(reverseList(toLinkedList([]))), []);
    console.log("All test cases passed!");
} catch (err) {
    console.error(err.message);
    process.exit(1);
}
"""
        }
    },
    "3Sum": {
        "difficulty": "Medium",
        "platform": "LeetCode",
        "python": {
            "starter_code": """class Solution:
    def threeSum(self, nums: list[int]) -> list[list[int]]:
        # Write your code here
        pass
""",
            "test_runner": """
sol = Solution()
res1 = [sorted(x) for x in sol.threeSum([-1,0,1,2,-1,-4])]
expected1 = [sorted(x) for x in [[-1,-1,2],[-1,0,1]]]
assert sorted(res1) == sorted(expected1), "Failed for [-1,0,1,2,-1,-4]"
assert sol.threeSum([0,1,1]) == [], "Failed for [0,1,1]"
assert sol.threeSum([0,0,0]) == [[0,0,0]], "Failed for [0,0,0]"
print("All test cases passed!")
"""
        },
        "javascript": {
            "starter_code": """/**
 * @param {number[]} nums
 * @return {number[][]}
 */
function threeSum(nums) {
    // Write your code here
    
}
""",
            "test_runner": """
const assert = require('assert');
const sortNested = arr => arr.map(x => x.slice().sort((a,b)=>a-b)).sort((a,b) => a[0]-b[0] || a[1]-b[1] || a[2]-b[2]);
try {
    const res1 = threeSum([-1,0,1,2,-1,-4]);
    const exp1 = [[-1,-1,2],[-1,0,1]];
    assert.deepStrictEqual(sortNested(res1), sortNested(exp1));
    assert.deepStrictEqual(threeSum([0,1,1]), []);
    assert.deepStrictEqual(threeSum([0,0,0]), [[0,0,0]]);
    console.log("All test cases passed!");
} catch (err) {
    console.error(err.message);
    process.exit(1);
}
"""
        }
    },
    "Container With Most Water": {
        "difficulty": "Medium",
        "platform": "LeetCode",
        "python": {
            "starter_code": """class Solution:
    def maxArea(self, height: list[int]) -> int:
        # Write your code here
        pass
""",
            "test_runner": """
sol = Solution()
assert sol.maxArea([1,8,6,2,5,4,8,3,7]) == 49, "Failed for [1,8,6,2,5,4,8,3,7]"
assert sol.maxArea([1,1]) == 1, "Failed for [1,1]"
print("All test cases passed!")
"""
        },
        "javascript": {
            "starter_code": """/**
 * @param {number[]} height
 * @return {number}
 */
function maxArea(height) {
    // Write your code here
    
}
""",
            "test_runner": """
const assert = require('assert');
try {
    assert.strictEqual(maxArea([1,8,6,2,5,4,8,3,7]), 49);
    assert.strictEqual(maxArea([1,1]), 1);
    console.log("All test cases passed!");
} catch (err) {
    console.error(err.message);
    process.exit(1);
}
"""
        }
    },
    "Longest Substring Without Repeating Characters": {
        "difficulty": "Medium",
        "platform": "LeetCode",
        "python": {
            "starter_code": """class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        # Write your code here
        pass
""",
            "test_runner": """
sol = Solution()
assert sol.lengthOfLongestSubstring("abcabcbb") == 3, "Failed for 'abcabcbb'"
assert sol.lengthOfLongestSubstring("bbbbb") == 1, "Failed for 'bbbbb'"
assert sol.lengthOfLongestSubstring("pwwkew") == 3, "Failed for 'pwwkew'"
print("All test cases passed!")
"""
        },
        "javascript": {
            "starter_code": """/**
 * @param {string} s
 * @return {number}
 */
function lengthOfLongestSubstring(s) {
    // Write your code here
    
}
""",
            "test_runner": """
const assert = require('assert');
try {
    assert.strictEqual(lengthOfLongestSubstring("abcabcbb"), 3);
    assert.strictEqual(lengthOfLongestSubstring("bbbbb"), 1);
    assert.strictEqual(lengthOfLongestSubstring("pwwkew"), 3);
    console.log("All test cases passed!");
} catch (err) {
    console.error(err.message);
    process.exit(1);
}
"""
        }
    },
    "Group Anagrams": {
        "difficulty": "Medium",
        "platform": "LeetCode",
        "python": {
            "starter_code": """class Solution:
    def groupAnagrams(self, strs: list[str]) -> list[list[str]]:
        # Write your code here
        pass
""",
            "test_runner": """
sol = Solution()
res = [sorted(x) for x in sol.groupAnagrams(["eat","tea","tan","ate","nat","bat"])]
expected = [sorted(x) for x in [["bat"],["nat","tan"],["ate","eat","tea"]]]
assert sorted(res) == sorted(expected), "Failed for standard list"
assert sol.groupAnagrams([""]) == [[""]], "Failed for empty string"
assert sol.groupAnagrams(["a"]) == [["a"]], "Failed for single character"
print("All test cases passed!")
"""
        },
        "javascript": {
            "starter_code": """/**
 * @param {string[]} strs
 * @return {string[][]}
 */
function groupAnagrams(strs) {
    // Write your code here
    
}
""",
            "test_runner": """
const assert = require('assert');
const sortNested = arr => arr.map(x => x.slice().sort()).sort((a,b) => a[0].localeCompare(b[0]) || a.length - b.length);
try {
    const res = groupAnagrams(["eat","tea","tan","ate","nat","bat"]);
    const expected = [["bat"],["nat","tan"],["ate","eat","tea"]];
    assert.deepStrictEqual(sortNested(res), sortNested(expected));
    assert.deepStrictEqual(groupAnagrams([""]), [[""]]);
    console.log("All test cases passed!");
} catch (err) {
    console.error(err.message);
    process.exit(1);
}
"""
        }
    },
    "Binary Tree Level Order Traversal": {
        "difficulty": "Medium",
        "platform": "LeetCode",
        "python": {
            "starter_code": """# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right

class Solution:
    def levelOrder(self, root: TreeNode) -> list[list[int]]:
        # Write your code here
        pass
""",
            "test_runner": """
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right
        
sol = Solution()
r = TreeNode(3)
r.left = TreeNode(9)
r.right = TreeNode(20)
r.right.left = TreeNode(15)
r.right.right = TreeNode(7)
assert sol.levelOrder(r) == [[3],[9,20],[15,7]], "Failed for standard tree"
assert sol.levelOrder(None) == [], "Failed for None root"
print("All test cases passed!")
"""
        },
        "javascript": {
            "starter_code": """/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {TreeNode} root
 * @return {number[][]}
 */
function levelOrder(root) {
    // Write your code here
    
}
""",
            "test_runner": """
const assert = require('assert');
function TreeNode(val, left, right) {
    this.val = (val===undefined ? 0 : val)
    this.left = (left===undefined ? null : left)
    this.right = (right===undefined ? null : right)
}
try {
    let r = new TreeNode(3);
    r.left = new TreeNode(9);
    r.right = new TreeNode(20);
    r.right.left = new TreeNode(15);
    r.right.right = new TreeNode(7);
    assert.deepStrictEqual(levelOrder(r), [[3],[9,20],[15,7]]);
    assert.deepStrictEqual(levelOrder(null), []);
    console.log("All test cases passed!");
} catch (err) {
    console.error(err.message);
    process.exit(1);
}
"""
        }
    },
    "Number of Islands": {
        "difficulty": "Medium",
        "platform": "LeetCode",
        "python": {
            "starter_code": """class Solution:
    def numIslands(self, grid: list[list[str]]) -> int:
        # Write your code here
        pass
""",
            "test_runner": """
sol = Solution()
g1 = [
  ["1","1","1","1","0"],
  ["1","1","0","1","0"],
  ["1","1","0","0","0"],
  ["0","0","0","0","0"]
]
assert sol.numIslands(g1) == 1, "Failed for grid 1"
g2 = [
  ["1","1","0","0","0"],
  ["1","1","0","0","0"],
  ["0","0","1","0","0"],
  ["0","0","0","1","1"]
]
assert sol.numIslands(g2) == 3, "Failed for grid 2"
print("All test cases passed!")
"""
        },
        "javascript": {
            "starter_code": """/**
 * @param {character[][]} grid
 * @return {number}
 */
function numIslands(grid) {
    // Write your code here
    
}
""",
            "test_runner": """
const assert = require('assert');
try {
    let g1 = [
      ["1","1","1","1","0"],
      ["1","1","0","1","0"],
      ["1","1","0","0","0"],
      ["0","0","0","0","0"]
    ];
    assert.strictEqual(numIslands(g1), 1);
    let g2 = [
      ["1","1","0","0","0"],
      ["1","1","0","0","0"],
      ["0","0","1","0","0"],
      ["0","0","0","1","1"]
    ];
    assert.strictEqual(numIslands(g2), 3);
    console.log("All test cases passed!");
} catch (err) {
    console.error(err.message);
    process.exit(1);
}
"""
        }
    },
    "Median of Two Sorted Arrays": {
        "difficulty": "Hard",
        "platform": "LeetCode",
        "python": {
            "starter_code": """class Solution:
    def findMedianSortedArrays(self, nums1: list[int], nums2: list[int]) -> float:
        # Write your code here
        pass
""",
            "test_runner": """
sol = Solution()
assert sol.findMedianSortedArrays([1,3], [2]) == 2.0, "Failed for [1,3], [2]"
assert sol.findMedianSortedArrays([1,2], [3,4]) == 2.5, "Failed for [1,2], [3,4]"
print("All test cases passed!")
"""
        },
        "javascript": {
            "starter_code": """/**
 * @param {number[]} nums1
 * @param {number[]} nums2
 * @return {number}
 */
function findMedianSortedArrays(nums1, nums2) {
    // Write your code here
    
}
""",
            "test_runner": """
const assert = require('assert');
try {
    assert.strictEqual(findMedianSortedArrays([1,3], [2]), 2.0);
    assert.strictEqual(findMedianSortedArrays([1,2], [3,4]), 2.5);
    console.log("All test cases passed!");
} catch (err) {
    console.error(err.message);
    process.exit(1);
}
"""
        }
    },
    "Merge k Sorted Lists": {
        "difficulty": "Hard",
        "platform": "LeetCode",
        "python": {
            "starter_code": """# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next

class Solution:
    def mergeKLists(self, lists: list[ListNode]) -> ListNode:
        # Write your code here
        pass
""",
            "test_runner": """
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def to_linked_list(arr):
    if not arr: return None
    head = ListNode(arr[0])
    curr = head
    for val in arr[1:]:
        curr.next = ListNode(val)
        curr = curr.next
    return head
    
def to_array(head):
    arr = []
    while head:
        arr.append(head.val)
        head = head.next
    return arr

sol = Solution()
lists = [to_linked_list([1,4,5]), to_linked_list([1,3,4]), to_linked_list([2,6])]
assert to_array(sol.mergeKLists(lists)) == [1,1,2,3,4,4,5,6], "Failed for lists [[1,4,5],[1,3,4],[2,6]]"
assert to_array(sol.mergeKLists([])) == [], "Failed for empty lists"
assert to_array(sol.mergeKLists([None])) == [], "Failed for list containing None"
print("All test cases passed!")
"""
        },
        "javascript": {
            "starter_code": """/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode[]} lists
 * @return {ListNode}
 */
function mergeKLists(lists) {
    // Write your code here
    
}
""",
            "test_runner": """
const assert = require('assert');
function ListNode(val, next) {
    this.val = (val===undefined ? 0 : val)
    this.next = (next===undefined ? null : next)
}
function toLinkedList(arr) {
    if (!arr.length) return null;
    let head = new ListNode(arr[0]);
    let curr = head;
    for (let i = 1; i < arr.length; i++) {
        curr.next = new ListNode(arr[i]);
        curr = curr.next;
    }
    return head;
}
function toArray(head) {
    let arr = [];
    while (head) {
        arr.push(head.val);
        head = head.next;
    }
    return arr;
}
try {
    let lists = [toLinkedList([1,4,5]), toLinkedList([1,3,4]), toLinkedList([2,6])];
    assert.deepStrictEqual(toArray(mergeKLists(lists)), [1,1,2,3,4,4,5,6]);
    assert.deepStrictEqual(toArray(mergeKLists([])), []);
    assert.deepStrictEqual(toArray(mergeKLists([null])), []);
    console.log("All test cases passed!");
} catch (err) {
    console.error(err.message);
    process.exit(1);
}
"""
        }
    },
    "Trapping Rain Water": {
        "difficulty": "Hard",
        "platform": "LeetCode",
        "python": {
            "starter_code": """class Solution:
    def trap(self, height: list[int]) -> int:
        # Write your code here
        pass
""",
            "test_runner": """
sol = Solution()
assert sol.trap([0,1,0,2,1,0,1,3,2,1,2,1]) == 6, "Failed for height map 1"
assert sol.trap([4,2,0,3,2,5]) == 9, "Failed for height map 2"
print("All test cases passed!")
"""
        },
        "javascript": {
            "starter_code": """/**
 * @param {number[]} height
 * @return {number}
 */
function trap(height) {
    // Write your code here
    
}
""",
            "test_runner": """
const assert = require('assert');
try {
    assert.strictEqual(trap([0,1,0,2,1,0,1,3,2,1,2,1]), 6);
    assert.strictEqual(trap([4,2,0,3,2,5]), 9);
    console.log("All test cases passed!");
} catch (err) {
    console.error(err.message);
    process.exit(1);
}
"""
        }
    },
    "Edit Distance": {
        "difficulty": "Hard",
        "platform": "LeetCode",
        "python": {
            "starter_code": """class Solution:
    def minDistance(self, word1: str, word2: str) -> int:
        # Write your code here
        pass
""",
            "test_runner": """
sol = Solution()
assert sol.minDistance("horse", "ros") == 3, "Failed for 'horse', 'ros'"
assert sol.minDistance("intention", "execution") == 5, "Failed for 'intention', 'execution'"
print("All test cases passed!")
"""
        },
        "javascript": {
            "starter_code": """/**
 * @param {string} word1
 * @param {string} word2
 * @return {number}
 */
function minDistance(word1, word2) {
    // Write your code here
    
}
""",
            "test_runner": """
const assert = require('assert');
try {
    assert.strictEqual(minDistance("horse", "ros"), 3);
    assert.strictEqual(minDistance("intention", "execution"), 5);
    console.log("All test cases passed!");
} catch (err) {
    console.error(err.message);
    process.exit(1);
}
"""
        }
    },
    "N-Queens": {
        "difficulty": "Hard",
        "platform": "LeetCode",
        "python": {
            "starter_code": """class Solution:
    def solveNQueens(self, n: int) -> list[list[str]]:
        # Write your code here
        pass
""",
            "test_runner": """
sol = Solution()
assert len(sol.solveNQueens(4)) == 2, "Failed for n=4 (expected 2 solutions)"
assert len(sol.solveNQueens(1)) == 1, "Failed for n=1 (expected 1 solution)"
print("All test cases passed!")
"""
        },
        "javascript": {
            "starter_code": """/**
 * @param {number} n
 * @return {string[][]}
 */
function solveNQueens(n) {
    // Write your code here
    
}
""",
            "test_runner": """
const assert = require('assert');
try {
    assert.strictEqual(solveNQueens(4).length, 2);
    assert.strictEqual(solveNQueens(1).length, 1);
    console.log("All test cases passed!");
} catch (err) {
    console.error(err.message);
    process.exit(1);
}
"""
        }
    }
}

def evaluate_code(question_title, user_code, language="python"):
    question = RECOMMENDED_QUESTIONS_DATA.get(question_title)
    if not question:
        return {"success": False, "error": f"Question '{question_title}' not found in roadmap."}
        
    lang_key = "javascript" if language.lower() in ["javascript", "js"] else "python"
    lang_data = question.get(lang_key)
    
    if not lang_data:
        return {"success": False, "error": f"Language '{language}' not supported for this question."}

    # Prepare execution code based on language
    if lang_key == "python":
        test_code = f"""
# --- User Code ---
{user_code}

# --- Test Runner ---
{lang_data['test_runner']}
"""
        suffix = ".py"
        run_args = [sys.executable]
    else:
        test_code = f"""
// --- User Code ---
{user_code}

// --- Test Runner ---
{lang_data['test_runner']}
"""
        suffix = ".js"
        run_args = ["node"]

    # Write to a temporary file
    temp_fd, temp_path = tempfile.mkstemp(suffix=suffix)
    try:
        with os.fdopen(temp_fd, 'w', encoding='utf-8') as f:
            f.write(test_code)
            
        # Execute the script in a subprocess with a timeout
        res = subprocess.run(
            run_args + [temp_path],
            capture_output=True,
            text=True,
            timeout=2.0
        )
        
        if res.returncode == 0:
            return {
                "success": True,
                "output": res.stdout,
                "difficulty": question["difficulty"],
                "platform": question["platform"]
            }
        else:
            # Output error message
            error_msg = res.stderr or res.stdout
            clean_error = error_msg.replace(temp_path, "solution" + suffix)
            return {
                "success": False,
                "error": clean_error
            }
            
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "error": "Time Limit Exceeded (execution exceeded 2.0 seconds). Make sure your code does not contain infinite loops."
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Internal execution error: {str(e)}"
        }
    finally:
        # Clean up temp file
        try:
            os.unlink(temp_path)
        except Exception:
            pass
