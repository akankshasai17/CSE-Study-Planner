// Curated Starter LeetCode Questions with Real Problem URLs
const starterLeetCodeProblems = [
  // 1. Arrays
  {
    title: 'Two Sum',
    topic: 'Arrays',
    difficulty: 'Easy',
    problemUrl: 'https://leetcode.com/problems/two-sum/',
    description: 'Find two numbers that add up to a specific target.',
  },
  {
    title: 'Best Time to Buy and Sell Stock',
    topic: 'Arrays',
    difficulty: 'Easy',
    problemUrl: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/',
    description: 'Maximize profit by choosing a single day to buy and a single day to sell stock.',
  },
  {
    title: 'Maximum Subarray',
    topic: 'Arrays',
    difficulty: 'Medium',
    problemUrl: 'https://leetcode.com/problems/maximum-subarray/',
    description: 'Find the contiguous subarray with the largest sum (Kadane’s Algorithm).',
  },
  {
    title: 'Container With Most Water',
    topic: 'Arrays',
    difficulty: 'Medium',
    problemUrl: 'https://leetcode.com/problems/container-with-most-water/',
    description: 'Find two lines that together with the x-axis forms a container that holds the most water.',
  },
  {
    title: 'First Missing Positive',
    topic: 'Arrays',
    difficulty: 'Hard',
    problemUrl: 'https://leetcode.com/problems/first-missing-positive/',
    description: 'Find the smallest positive integer that is missing from an unsorted array in O(n) time.',
  },

  // 2. Strings
  {
    title: 'Valid Palindrome',
    topic: 'Strings',
    difficulty: 'Easy',
    problemUrl: 'https://leetcode.com/problems/valid-palindrome/',
    description: 'Determine if a string is a palindrome considering only alphanumeric characters.',
  },
  {
    title: 'Longest Substring Without Repeating Characters',
    topic: 'Strings',
    difficulty: 'Medium',
    problemUrl: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
    description: 'Find the length of the longest substring without repeating characters.',
  },
  {
    title: 'Longest Palindromic Substring',
    topic: 'Strings',
    difficulty: 'Medium',
    problemUrl: 'https://leetcode.com/problems/longest-palindromic-substring/',
    description: 'Return the longest palindromic substring in a string.',
  },
  {
    title: 'Minimum Window Substring',
    topic: 'Strings',
    difficulty: 'Hard',
    problemUrl: 'https://leetcode.com/problems/minimum-window-substring/',
    description: 'Find minimum window in s which will contain all the characters in t.',
  },

  // 3. Hashing
  {
    title: 'Contains Duplicate',
    topic: 'Hashing',
    difficulty: 'Easy',
    problemUrl: 'https://leetcode.com/problems/contains-duplicate/',
    description: 'Return true if any value appears at least twice in an integer array.',
  },
  {
    title: 'Valid Anagram',
    topic: 'Hashing',
    difficulty: 'Easy',
    problemUrl: 'https://leetcode.com/problems/valid-anagram/',
    description: 'Determine if string t is an anagram of string s.',
  },
  {
    title: 'Group Anagrams',
    topic: 'Hashing',
    difficulty: 'Medium',
    problemUrl: 'https://leetcode.com/problems/group-anagrams/',
    description: 'Group an array of strings into collections of anagrams.',
  },
  {
    title: 'Top K Frequent Elements',
    topic: 'Hashing',
    difficulty: 'Medium',
    problemUrl: 'https://leetcode.com/problems/top-k-frequent-elements/',
    description: 'Given an integer array and an integer k, return the k most frequent elements.',
  },

  // 4. Two Pointers
  {
    title: 'Two Sum II - Input Array Is Sorted',
    topic: 'Two Pointers',
    difficulty: 'Medium',
    problemUrl: 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/',
    description: 'Find two numbers in 1-indexed sorted array that add up to target.',
  },
  {
    title: '3Sum',
    topic: 'Two Pointers',
    difficulty: 'Medium',
    problemUrl: 'https://leetcode.com/problems/3sum/',
    description: 'Find all unique triplets in the array which gives the sum of zero.',
  },
  {
    title: 'Trapping Rain Water',
    topic: 'Two Pointers',
    difficulty: 'Hard',
    problemUrl: 'https://leetcode.com/problems/trapping-rain-water/',
    description: 'Compute how much water an elevation map can trap after raining.',
  },

  // 5. Sliding Window
  {
    title: 'Longest Repeating Character Replacement',
    topic: 'Sliding Window',
    difficulty: 'Medium',
    problemUrl: 'https://leetcode.com/problems/longest-repeating-character-replacement/',
    description: 'Find length of longest substring containing same letter after k replacements.',
  },
  {
    title: 'Permutation in String',
    topic: 'Sliding Window',
    difficulty: 'Medium',
    problemUrl: 'https://leetcode.com/problems/permutation-in-string/',
    description: 'Determine if s2 contains a permutation of s1.',
  },
  {
    title: 'Sliding Window Maximum',
    topic: 'Sliding Window',
    difficulty: 'Hard',
    problemUrl: 'https://leetcode.com/problems/sliding-window-maximum/',
    description: 'Find maximum element in sliding window of size k moving from left to right.',
  },

  // 6. Binary Search
  {
    title: 'Binary Search',
    topic: 'Binary Search',
    difficulty: 'Easy',
    problemUrl: 'https://leetcode.com/problems/binary-search/',
    description: 'Search target in sorted array in O(log n) runtime complexity.',
  },
  {
    title: 'Search in Rotated Sorted Array',
    topic: 'Binary Search',
    difficulty: 'Medium',
    problemUrl: 'https://leetcode.com/problems/search-in-rotated-sorted-array/',
    description: 'Find the index of target in sorted array rotated at unknown pivot.',
  },
  {
    title: 'Find Minimum in Rotated Sorted Array',
    topic: 'Binary Search',
    difficulty: 'Medium',
    problemUrl: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/',
    description: 'Find the minimum element in rotated sorted array.',
  },
  {
    title: 'Median of Two Sorted Arrays',
    topic: 'Binary Search',
    difficulty: 'Hard',
    problemUrl: 'https://leetcode.com/problems/median-of-two-sorted-arrays/',
    description: 'Find median of two sorted arrays of sizes m and n in O(log (m+n)).',
  },

  // 7. Linked Lists
  {
    title: 'Reverse Linked List',
    topic: 'Linked Lists',
    difficulty: 'Easy',
    problemUrl: 'https://leetcode.com/problems/reverse-linked-list/',
    description: 'Reverse a singly linked list iteratively and recursively.',
  },
  {
    title: 'Merge Two Sorted Lists',
    topic: 'Linked Lists',
    difficulty: 'Easy',
    problemUrl: 'https://leetcode.com/problems/merge-two-sorted-lists/',
    description: 'Merge two sorted linked lists and return it as a new sorted list.',
  },
  {
    title: 'Linked List Cycle',
    topic: 'Linked Lists',
    difficulty: 'Easy',
    problemUrl: 'https://leetcode.com/problems/linked-list-cycle/',
    description: 'Determine if linked list has a cycle using Floyd cycle-finding algorithm.',
  },
  {
    title: 'Reorder List',
    topic: 'Linked Lists',
    difficulty: 'Medium',
    problemUrl: 'https://leetcode.com/problems/reorder-list/',
    description: 'Reorder list so L0 -> Ln -> L1 -> Ln-1 ... without modifying node values.',
  },
  {
    title: 'Merge k Sorted Lists',
    topic: 'Linked Lists',
    difficulty: 'Hard',
    problemUrl: 'https://leetcode.com/problems/merge-k-sorted-lists/',
    description: 'Merge k sorted linked lists and return it as one sorted list.',
  },

  // 8. Stack
  {
    title: 'Valid Parentheses',
    topic: 'Stack',
    difficulty: 'Easy',
    problemUrl: 'https://leetcode.com/problems/valid-parentheses/',
    description: 'Determine if input string brackets are valid in closing order.',
  },
  {
    title: 'Min Stack',
    topic: 'Stack',
    difficulty: 'Medium',
    problemUrl: 'https://leetcode.com/problems/min-stack/',
    description: 'Design a stack that supports push, pop, top, and retrieving min element in O(1).',
  },
  {
    title: 'Daily Temperatures',
    topic: 'Stack',
    difficulty: 'Medium',
    problemUrl: 'https://leetcode.com/problems/daily-temperatures/',
    description: 'Find number of days to wait until a warmer temperature using monotonic stack.',
  },
  {
    title: 'Largest Rectangle in Histogram',
    topic: 'Stack',
    difficulty: 'Hard',
    problemUrl: 'https://leetcode.com/problems/largest-rectangle-in-histogram/',
    description: 'Find area of largest rectangle in histogram bars.',
  },

  // 9. Queue
  {
    title: 'Implement Queue using Stacks',
    topic: 'Queue',
    difficulty: 'Easy',
    problemUrl: 'https://leetcode.com/problems/implement-queue-using-stacks/',
    description: 'Implement a FIFO queue using only two LIFO stacks.',
  },
  {
    title: 'Design Circular Queue',
    topic: 'Queue',
    difficulty: 'Medium',
    problemUrl: 'https://leetcode.com/problems/design-circular-queue/',
    description: 'Design circular queue data structure with fixed size buffer.',
  },

  // 10. Trees
  {
    title: 'Maximum Depth of Binary Tree',
    topic: 'Trees',
    difficulty: 'Easy',
    problemUrl: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/',
    description: 'Find the number of nodes along longest path from root down to furthest leaf.',
  },
  {
    title: 'Invert Binary Tree',
    topic: 'Trees',
    difficulty: 'Easy',
    problemUrl: 'https://leetcode.com/problems/invert-binary-tree/',
    description: 'Invert a binary tree and return its root.',
  },
  {
    title: 'Validate Binary Search Tree',
    topic: 'Trees',
    difficulty: 'Medium',
    problemUrl: 'https://leetcode.com/problems/validate-binary-search-tree/',
    description: 'Determine if binary tree is a valid binary search tree.',
  },
  {
    title: 'Binary Tree Level Order Traversal',
    topic: 'Trees',
    difficulty: 'Medium',
    problemUrl: 'https://leetcode.com/problems/binary-tree-level-order-traversal/',
    description: 'Return level order traversal of nodes values (BFS).',
  },
  {
    title: 'Binary Tree Maximum Path Sum',
    topic: 'Trees',
    difficulty: 'Hard',
    problemUrl: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/',
    description: 'Find maximum path sum of any non-empty path in binary tree.',
  },

  // 11. Graphs
  {
    title: 'Number of Islands',
    topic: 'Graphs',
    difficulty: 'Medium',
    problemUrl: 'https://leetcode.com/problems/number-of-islands/',
    description: 'Count number of islands in 2D binary grid using BFS/DFS.',
  },
  {
    title: 'Clone Graph',
    topic: 'Graphs',
    difficulty: 'Medium',
    problemUrl: 'https://leetcode.com/problems/clone-graph/',
    description: 'Deep copy a connected undirected graph.',
  },
  {
    title: 'Course Schedule',
    topic: 'Graphs',
    difficulty: 'Medium',
    problemUrl: 'https://leetcode.com/problems/course-schedule/',
    description: 'Detect cycle in directed graph using topological sort.',
  },
  {
    title: 'Word Ladder',
    topic: 'Graphs',
    difficulty: 'Hard',
    problemUrl: 'https://leetcode.com/problems/word-ladder/',
    description: 'Find length of shortest transformation sequence from beginWord to endWord.',
  },

  // 12. Recursion
  {
    title: 'Fibonacci Number',
    topic: 'Recursion',
    difficulty: 'Easy',
    problemUrl: 'https://leetcode.com/problems/fibonacci-number/',
    description: 'Compute nth Fibonacci number using recursion and memoization.',
  },
  {
    title: 'Power of Two',
    topic: 'Recursion',
    difficulty: 'Easy',
    problemUrl: 'https://leetcode.com/problems/power-of-two/',
    description: 'Determine if integer n is a power of two.',
  },
  {
    title: 'Pow(x, n)',
    topic: 'Recursion',
    difficulty: 'Medium',
    problemUrl: 'https://leetcode.com/problems/powx-n/',
    description: 'Calculate x raised to power n using fast exponentiation.',
  },

  // 13. Backtracking
  {
    title: 'Subsets',
    topic: 'Backtracking',
    difficulty: 'Medium',
    problemUrl: 'https://leetcode.com/problems/subsets/',
    description: 'Generate power set of all possible subsets for distinct integers.',
  },
  {
    title: 'Combination Sum',
    topic: 'Backtracking',
    difficulty: 'Medium',
    problemUrl: 'https://leetcode.com/problems/combination-sum/',
    description: 'Find all unique combinations of candidates where numbers sum to target.',
  },
  {
    title: 'Permutations',
    topic: 'Backtracking',
    difficulty: 'Medium',
    problemUrl: 'https://leetcode.com/problems/permutations/',
    description: 'Return all possible permutations of an array of distinct integers.',
  },
  {
    title: 'N-Queens',
    topic: 'Backtracking',
    difficulty: 'Hard',
    problemUrl: 'https://leetcode.com/problems/n-queens/',
    description: 'Place n queens on n×n chessboard such that no two queens attack each other.',
  },

  // 14. Dynamic Programming
  {
    title: 'Climbing Stairs',
    topic: 'Dynamic Programming',
    difficulty: 'Easy',
    problemUrl: 'https://leetcode.com/problems/climbing-stairs/',
    description: 'Count distinct ways to climb top of staircase with 1 or 2 steps.',
  },
  {
    title: 'Coin Change',
    topic: 'Dynamic Programming',
    difficulty: 'Medium',
    problemUrl: 'https://leetcode.com/problems/coin-change/',
    description: 'Find fewest number of coins needed to make up a given amount.',
  },
  {
    title: 'Longest Increasing Subsequence',
    topic: 'Dynamic Programming',
    difficulty: 'Medium',
    problemUrl: 'https://leetcode.com/problems/longest-increasing-subsequence/',
    description: 'Find length of longest strictly increasing subsequence in integer array.',
  },
  {
    title: 'House Robber',
    topic: 'Dynamic Programming',
    difficulty: 'Medium',
    problemUrl: 'https://leetcode.com/problems/house-robber/',
    description: 'Maximize money stolen from adjacent houses without alerting police.',
  },
  {
    title: 'Edit Distance',
    topic: 'Dynamic Programming',
    difficulty: 'Hard',
    problemUrl: 'https://leetcode.com/problems/edit-distance/',
    description: 'Find minimum operations to convert word1 to word2 (insert, delete, replace).',
  },
];

// Curated Starter 7 Core CSE Subjects Syllabus with Modules & Topics
const starterCoreSubjects = [
  {
    name: 'Data Structures and Algorithms (DSA)',
    code: 'CS301',
    description: 'Fundamental data structures, search/sort algorithms, asymptotic complexity, and graph traversal.',
    modules: [
      {
        name: 'Module 1: Linear Data Structures',
        topics: [
          { name: 'Arrays & Dynamic Arrays', status: 'Pending' },
          { name: 'Singly and Doubly Linked Lists', status: 'Pending' },
          { name: 'Stack Operations & Infix/Postfix Evaluation', status: 'Pending' },
          { name: 'Circular & Priority Queues', status: 'Pending' },
        ],
      },
      {
        name: 'Module 2: Non-Linear Data Structures',
        topics: [
          { name: 'Binary Trees & Tree Traversals', status: 'Pending' },
          { name: 'Binary Search Trees (BST) & AVL Balancing', status: 'Pending' },
          { name: 'Min-Heap and Max-Heap Operations', status: 'Pending' },
          { name: 'Trie Data Structure for String Retrieval', status: 'Pending' },
        ],
      },
      {
        name: 'Module 3: Sorting and Searching',
        topics: [
          { name: 'Linear and Binary Search Techniques', status: 'Pending' },
          { name: 'Merge Sort and Quick Sort Algorithms', status: 'Pending' },
          { name: 'Heap Sort and Radix Sort', status: 'Pending' },
          { name: 'Hashing and Hash Collision Resolution', status: 'Pending' },
        ],
      },
      {
        name: 'Module 4: Graph Algorithms',
        topics: [
          { name: 'Breadth First Search (BFS) & Depth First Search (DFS)', status: 'Pending' },
          { name: 'Dijkstra Single Source Shortest Path', status: 'Pending' },
          { name: 'Minimum Spanning Tree (Prim and Kruskal)', status: 'Pending' },
          { name: 'Topological Sort and Cycle Detection', status: 'Pending' },
        ],
      },
    ],
  },
  {
    name: 'Database Management Systems (DBMS)',
    code: 'CS302',
    description: 'Relational data models, normalization, SQL queries, transaction processing, and concurrency control.',
    modules: [
      {
        name: 'Module 1: Relational Data Model & SQL',
        topics: [
          { name: 'ER Modeling and Conversion to Relational Schema', status: 'Pending' },
          { name: 'Relational Algebra and Calculus Operations', status: 'Pending' },
          { name: 'DDL, DML, Complex Joins, and Subqueries', status: 'Pending' },
          { name: 'Integrity Constraints and Triggers', status: 'Pending' },
        ],
      },
      {
        name: 'Module 2: Database Normalization',
        topics: [
          { name: 'Functional Dependencies and Attribute Closure', status: 'Pending' },
          { name: 'First, Second, and Third Normal Forms (1NF, 2NF, 3NF)', status: 'Pending' },
          { name: 'Boyce-Codd Normal Form (BCNF)', status: 'Pending' },
          { name: 'Lossless Decomposition and Dependency Preservation', status: 'Pending' },
        ],
      },
      {
        name: 'Module 3: Transactions and Concurrency',
        topics: [
          { name: 'ACID Properties and Transaction States', status: 'Pending' },
          { name: 'Conflict and View Serializability', status: 'Pending' },
          { name: 'Two-Phase Locking (2PL) Protocol', status: 'Pending' },
          { name: 'Deadlock Detection, Prevention, and Recovery', status: 'Pending' },
        ],
      },
      {
        name: 'Module 4: Storage, Indexing & Query Optimization',
        topics: [
          { name: 'File Organizations and B/B+ Tree Indexing', status: 'Pending' },
          { name: 'Static and Dynamic Hashing Techniques', status: 'Pending' },
          { name: 'Query Processing Pipelines and Cost Estimation', status: 'Pending' },
        ],
      },
    ],
  },
  {
    name: 'Operating Systems (OS)',
    code: 'CS303',
    description: 'Process management, CPU scheduling, thread synchronization, memory management, and file systems.',
    modules: [
      {
        name: 'Module 1: Processes and CPU Scheduling',
        topics: [
          { name: 'Process State Model, PCB, and Context Switching', status: 'Pending' },
          { name: 'User vs Kernel Threads and Multi-threading Models', status: 'Pending' },
          { name: 'Preemptive vs Non-preemptive Scheduling', status: 'Pending' },
          { name: 'FCFS, SJF, Round Robin, and Priority Algorithms', status: 'Pending' },
        ],
      },
      {
        name: 'Module 2: Synchronization & Deadlocks',
        topics: [
          { name: 'Critical Section Problem & Peterson Solution', status: 'Pending' },
          { name: 'Counting Semaphores and Mutex Locks', status: 'Pending' },
          { name: 'Dining Philosophers and Producer-Consumer Problems', status: 'Pending' },
          { name: 'Banker’s Algorithm for Deadlock Avoidance', status: 'Pending' },
        ],
      },
      {
        name: 'Module 3: Memory Management',
        topics: [
          { name: 'Contiguous Allocation and Dynamic Partitioning', status: 'Pending' },
          { name: 'Paging Architecture, TLB, and Inverted Page Tables', status: 'Pending' },
          { name: 'Segmentation and Segmented Paging', status: 'Pending' },
          { name: 'Virtual Memory, Page Faults, and Thrashing', status: 'Pending' },
          { name: 'FIFO, LRU, and Optimal Page Replacement', status: 'Pending' },
        ],
      },
      {
        name: 'Module 4: Storage and File Systems',
        topics: [
          { name: 'File Attributes, Directory Structures, and Access Methods', status: 'Pending' },
          { name: 'Disk Scheduling (SSTF, SCAN, C-SCAN, LOOK)', status: 'Pending' },
          { name: 'RAID Levels and Fault Tolerance', status: 'Pending' },
        ],
      },
    ],
  },
  {
    name: 'Computer Networks (CN)',
    code: 'CS304',
    description: 'Layered network architectures, error control, routing protocols, TCP congestion control, and application services.',
    modules: [
      {
        name: 'Module 1: Network Fundamentals & Data Link',
        topics: [
          { name: 'OSI 7-Layer Reference Model vs TCP/IP Protocol Suite', status: 'Pending' },
          { name: 'Framing, Bit-Stuffing, and Byte-Stuffing', status: 'Pending' },
          { name: 'Error Detection: Parity, Checksum, and CRC', status: 'Pending' },
          { name: 'Stop-and-Wait and Sliding Window Protocols (Go-Back-N, SR)', status: 'Pending' },
        ],
      },
      {
        name: 'Module 2: Medium Access Control (MAC)',
        topics: [
          { name: 'ALOHA (Pure and Slotted) and Throughput Analysis', status: 'Pending' },
          { name: 'CSMA, CSMA/CD (Ethernet) and CSMA/CA (Wi-Fi)', status: 'Pending' },
          { name: 'IEEE 802.3 and 802.11 Standards', status: 'Pending' },
        ],
      },
      {
        name: 'Module 3: Network Layer & Routing',
        topics: [
          { name: 'IPv4 Header, Classful/Classless Addressing, and CIDR', status: 'Pending' },
          { name: 'Subnetting, Supernetting, and NAT Translation', status: 'Pending' },
          { name: 'Distance Vector Routing & Link State Routing (OSPF)', status: 'Pending' },
          { name: 'Border Gateway Protocol (BGP) & IPv6 Overview', status: 'Pending' },
        ],
      },
      {
        name: 'Module 4: Transport and Application Layers',
        topics: [
          { name: 'TCP 3-Way Handshake and Connection Teardown', status: 'Pending' },
          { name: 'UDP vs TCP Header Differences and Use Cases', status: 'Pending' },
          { name: 'TCP Congestion Control (Slow Start, Congestion Avoidance)', status: 'Pending' },
          { name: 'DNS, HTTP/1.1 vs HTTP/2, HTTPS, and SMTP Protocols', status: 'Pending' },
        ],
      },
    ],
  },
  {
    name: 'Design and Analysis of Algorithms (DAA)',
    code: 'CS401',
    description: 'Asymptotic notation, Divide & Conquer, Greedy strategies, Dynamic Programming, and NP-completeness.',
    modules: [
      {
        name: 'Module 1: Algorithm Analysis & Recurrences',
        topics: [
          { name: 'Asymptotic Notations: Big-O, Omega, Theta', status: 'Pending' },
          { name: 'Substitution and Recursion Tree Methods', status: 'Pending' },
          { name: 'Master Theorem for Solving Recurrences', status: 'Pending' },
        ],
      },
      {
        name: 'Module 2: Divide and Conquer',
        topics: [
          { name: 'Divide and Conquer Paradigm & Quick Select', status: 'Pending' },
          { name: 'Strassen’s Matrix Multiplication', status: 'Pending' },
          { name: 'Closest Pair of Points & Convex Hull Algorithms', status: 'Pending' },
        ],
      },
      {
        name: 'Module 3: Greedy & Dynamic Programming Strategies',
        topics: [
          { name: 'Fractional Knapsack & Huffman Coding', status: 'Pending' },
          { name: '0/1 Knapsack Problem and Bellman-Ford Algorithm', status: 'Pending' },
          { name: 'Matrix Chain Multiplication & Optimal BST', status: 'Pending' },
          { name: 'Longest Common Subsequence (LCS) Problem', status: 'Pending' },
        ],
      },
      {
        name: 'Module 4: Tractability & Intractability',
        topics: [
          { name: 'Polynomial Time Verification & Class P vs NP', status: 'Pending' },
          { name: 'NP-Complete and NP-Hard Classifications', status: 'Pending' },
          { name: 'Cook-Levin Theorem and Polynomial Reductions', status: 'Pending' },
        ],
      },
    ],
  },
  {
    name: 'Computer Organization and Architecture (COA)',
    code: 'CS202',
    description: 'Instruction set architecture, CPU datapath, microprogramming, memory hierarchy, cache mapping, and pipelining.',
    modules: [
      {
        name: 'Module 1: Digital Representation & Register Transfer',
        topics: [
          { name: 'Two’s Complement Arithmetic and IEEE 754 Floating Point', status: 'Pending' },
          { name: 'Register Transfer Language (RTL) & Micro-operations', status: 'Pending' },
          { name: 'Instruction Cycles, Fetch, Decode, and Execute', status: 'Pending' },
        ],
      },
      {
        name: 'Module 2: CPU Datapath and Control Unit',
        topics: [
          { name: 'Addressing Modes: Immediate, Direct, Indirect, Register', status: 'Pending' },
          { name: 'Hardwired Control vs Microprogrammed Control Unit', status: 'Pending' },
          { name: 'Booth’s Multiplication Algorithm & Restoring Division', status: 'Pending' },
        ],
      },
      {
        name: 'Module 3: Memory Hierarchy & Cache',
        topics: [
          { name: 'Memory Hierarchy Organization and Hit/Miss Rates', status: 'Pending' },
          { name: 'Direct, Fully Associative, and Set Associative Cache Mapping', status: 'Pending' },
          { name: 'Cache Replacement Policies (LRU, FIFO, LFU)', status: 'Pending' },
          { name: 'Write-Through vs Write-Back Cache Strategies', status: 'Pending' },
        ],
      },
      {
        name: 'Module 4: Pipelining & I/O Organization',
        topics: [
          { name: 'Linear Instruction Pipelining and Speedup Factor', status: 'Pending' },
          { name: 'Pipeline Hazards: Structural, Data, and Control Hazards', status: 'Pending' },
          { name: 'Programmed I/O, Interrupt-Driven I/O, and Direct Memory Access (DMA)', status: 'Pending' },
        ],
      },
    ],
  },
  {
    name: 'Object-Oriented Programming (OOP)',
    code: 'CS201',
    description: 'Encapsulation, inheritance, polymorphism, abstraction, exception handling, design patterns, and SOLID principles.',
    modules: [
      {
        name: 'Module 1: Core OOP Foundations',
        topics: [
          { name: 'Encapsulation, Data Hiding, and Access Specifiers', status: 'Pending' },
          { name: 'Class Blueprints, Object Instantiation, and this Reference', status: 'Pending' },
          { name: 'Constructor Types (Default, Parameterized, Copy) & Destructors', status: 'Pending' },
        ],
      },
      {
        name: 'Module 2: Inheritance & Polymorphism',
        topics: [
          { name: 'Single, Multilevel, Multiple, and Hierarchical Inheritance', status: 'Pending' },
          { name: 'Compile-Time Polymorphism (Method & Operator Overloading)', status: 'Pending' },
          { name: 'Run-Time Polymorphism (Method Overriding & Virtual Functions)', status: 'Pending' },
          { name: 'Abstract Classes vs Pure Interfaces', status: 'Pending' },
        ],
      },
      {
        name: 'Module 3: Advanced Concepts & Robustness',
        topics: [
          { name: 'Exception Handling: Try, Catch, Throw, and Custom Exceptions', status: 'Pending' },
          { name: 'Generics and Template Programming', status: 'Pending' },
          { name: 'Garbage Collection and Memory Lifecycle', status: 'Pending' },
        ],
      },
      {
        name: 'Module 4: SOLID Principles & Design Patterns',
        topics: [
          { name: 'SOLID Principles of Object-Oriented Software Design', status: 'Pending' },
          { name: 'Creational Patterns: Singleton and Factory Methods', status: 'Pending' },
          { name: 'Structural & Behavioral Patterns: Adapter and Observer', status: 'Pending' },
        ],
      },
    ],
  },
];

module.exports = {
  starterLeetCodeProblems,
  starterCoreSubjects,
};
