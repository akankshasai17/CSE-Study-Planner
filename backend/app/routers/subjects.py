from datetime import date, datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, Subject, SyllabusTopic, StudySession
from app.schemas.schemas import (
    SubjectCreate,
    SubjectUpdate,
    SubjectResponse,
    SyllabusTopicCreate,
    SyllabusTopicUpdate,
    SyllabusTopicResponse,
    SubjectStudyHoursLog,
)

router = APIRouter(prefix="/api/subjects", tags=["Subjects & Syllabus"])


DEFAULT_CSE_SUBJECTS = [
    {
        "name": "Data Structures and Algorithms",
        "code": "CS301",
        "description": "Linear and non-linear data structures, trees, heaps, graphs, hashing, and complexity analysis.",
        "semester": 3,
        "credits": 4,
        "priority": "Critical",
        "color": "#2563eb",
        "target_study_hours": 60.0,
        "topics": [
            {"chapter_number": 1, "chapter_title": "Arrays, Linked Lists & Stacks", "module_name": "Unit 1", "topic_title": "Dynamic Arrays, Singly/Doubly Linked Lists & Stack Applications", "estimated_hours": 4.0},
            {"chapter_number": 2, "chapter_title": "Trees & Binary Search Trees", "module_name": "Unit 2", "topic_title": "Tree Traversals, AVL Trees & Red-Black Trees", "estimated_hours": 5.0},
            {"chapter_number": 3, "chapter_title": "Heaps & Hashing", "module_name": "Unit 3", "topic_title": "Priority Queues, Heap Sort & Collision Resolution", "estimated_hours": 4.0},
            {"chapter_number": 4, "chapter_title": "Graphs", "module_name": "Unit 4", "topic_title": "BFS, DFS, Dijkstra, Bellman-Ford & Minimum Spanning Trees", "estimated_hours": 6.0},
        ],
    },
    {
        "name": "Database Management Systems",
        "code": "CS402",
        "description": "Relational model, SQL, normalization, indexing, transaction processing, concurrency control, and recovery.",
        "semester": 4,
        "credits": 4,
        "priority": "High",
        "color": "#7c3aed",
        "target_study_hours": 45.0,
        "topics": [
            {"chapter_number": 1, "chapter_title": "ER Modeling & Relational Algebra", "module_name": "Unit 1", "topic_title": "ER Diagrams, Relational Calculus & Codd's Rules", "estimated_hours": 3.0},
            {"chapter_number": 2, "chapter_title": "SQL & Normalization", "module_name": "Unit 2", "topic_title": "Complex Joins, Subqueries, 1NF, 2NF, 3NF, BCNF", "estimated_hours": 4.5},
            {"chapter_number": 3, "chapter_title": "Transactions & Concurrency", "module_name": "Unit 3", "topic_title": "ACID Properties, Serializability & Two-Phase Locking", "estimated_hours": 4.5},
            {"chapter_number": 4, "chapter_title": "Indexing & File Organization", "module_name": "Unit 4", "topic_title": "B-Trees, B+ Trees & Hash Indexing", "estimated_hours": 3.5},
        ],
    },
    {
        "name": "Operating Systems",
        "code": "CS403",
        "description": "Process management, CPU scheduling, synchronization, deadlocks, virtual memory, and file systems.",
        "semester": 4,
        "credits": 4,
        "priority": "High",
        "color": "#0891b2",
        "target_study_hours": 50.0,
        "topics": [
            {"chapter_number": 1, "chapter_title": "Processes & Threads", "module_name": "Unit 1", "topic_title": "Process States, Context Switching, CPU Scheduling Algorithms", "estimated_hours": 4.0},
            {"chapter_number": 2, "chapter_title": "Process Synchronization & Deadlocks", "module_name": "Unit 2", "topic_title": "Semaphores, Mutex, Monitors & Banker's Algorithm", "estimated_hours": 5.0},
            {"chapter_number": 3, "chapter_title": "Memory Management", "module_name": "Unit 3", "topic_title": "Paging, Segmentation, Virtual Memory & Page Replacement", "estimated_hours": 5.0},
            {"chapter_number": 4, "chapter_title": "Storage & File Systems", "module_name": "Unit 4", "topic_title": "Disk Scheduling (SCAN, C-SCAN) & Inode Structures", "estimated_hours": 3.5},
        ],
    },
    {
        "name": "Computer Networks",
        "code": "CS501",
        "description": "OSI & TCP/IP architectures, data link protocols, IP addressing, routing algorithms, TCP congestion control, and application layer.",
        "semester": 5,
        "credits": 4,
        "priority": "High",
        "color": "#059669",
        "target_study_hours": 45.0,
        "topics": [
            {"chapter_number": 1, "chapter_title": "Physical & Data Link Layer", "module_name": "Unit 1", "topic_title": "Framing, Error Detection (CRC), Sliding Window & CSMA/CD", "estimated_hours": 4.0},
            {"chapter_number": 2, "chapter_title": "Network Layer & Routing", "module_name": "Unit 2", "topic_title": "IPv4 Subnetting, CIDR, OSPF, BGP & Distance Vector Routing", "estimated_hours": 5.0},
            {"chapter_number": 3, "chapter_title": "Transport Layer", "module_name": "Unit 3", "topic_title": "TCP 3-Way Handshake, Flow Control & Congestion Control", "estimated_hours": 4.5},
            {"chapter_number": 4, "chapter_title": "Application Layer", "module_name": "Unit 4", "topic_title": "DNS, HTTP/HTTPS, TLS & Socket Programming", "estimated_hours": 3.5},
        ],
    },
    {
        "name": "Object-Oriented Programming",
        "code": "CS302",
        "description": "Encapsulation, inheritance, polymorphism, abstraction, SOLID design principles, exception handling, and generics.",
        "semester": 3,
        "credits": 3,
        "priority": "Medium",
        "color": "#d97706",
        "target_study_hours": 35.0,
        "topics": [
            {"chapter_number": 1, "chapter_title": "Classes, Objects & Encapsulation", "module_name": "Unit 1", "topic_title": "Constructors, Access Modifiers & Memory Lifecycle", "estimated_hours": 3.0},
            {"chapter_number": 2, "chapter_title": "Inheritance & Polymorphism", "module_name": "Unit 2", "topic_title": "Method Overloading/Overriding, Interfaces & Abstract Classes", "estimated_hours": 4.0},
            {"chapter_number": 3, "chapter_title": "Design Patterns & SOLID", "module_name": "Unit 3", "topic_title": "Singleton, Factory, Observer & SOLID Principles", "estimated_hours": 4.0},
        ],
    },
    {
        "name": "Software Engineering",
        "code": "CS502",
        "description": "SDLC models, Agile/Scrum, requirements engineering, architecture design, testing strategies, and DevOps CI/CD.",
        "semester": 5,
        "credits": 3,
        "priority": "Medium",
        "color": "#db2777",
        "target_study_hours": 35.0,
        "topics": [
            {"chapter_number": 1, "chapter_title": "SDLC & Agile Methodologies", "module_name": "Unit 1", "topic_title": "Waterfall, Spiral, Scrum Sprints & Kanban", "estimated_hours": 3.0},
            {"chapter_number": 2, "chapter_title": "Requirements & UML Modeling", "module_name": "Unit 2", "topic_title": "SRS Document, Use Case, Sequence & Class Diagrams", "estimated_hours": 3.5},
            {"chapter_number": 3, "chapter_title": "Software Testing & Quality", "module_name": "Unit 3", "topic_title": "Unit, Integration, System Testing, White-box & Black-box", "estimated_hours": 4.0},
        ],
    },
    {
        "name": "Design and Analysis of Algorithms",
        "code": "CS401",
        "description": "Asymptotic notation, divide and conquer, greedy algorithms, dynamic programming, backtracking, and NP-completeness.",
        "semester": 4,
        "credits": 4,
        "priority": "Critical",
        "color": "#4f46e5",
        "target_study_hours": 55.0,
        "topics": [
            {"chapter_number": 1, "chapter_title": "Asymptotic Analysis & Recurrences", "module_name": "Unit 1", "topic_title": "Big-O, Omega, Theta & Master Theorem", "estimated_hours": 4.0},
            {"chapter_number": 2, "chapter_title": "Divide & Conquer and Greedy", "module_name": "Unit 2", "topic_title": "Merge Sort, Quick Sort, Fractional Knapsack & Huffman Coding", "estimated_hours": 5.0},
            {"chapter_number": 3, "chapter_title": "Dynamic Programming", "module_name": "Unit 3", "topic_title": "0/1 Knapsack, LCS, Matrix Chain Multiplication & Floyd-Warshall", "estimated_hours": 6.0},
            {"chapter_number": 4, "chapter_title": "Backtracking & NP-Completeness", "module_name": "Unit 4", "topic_title": "N-Queens, Subset Sum, P vs NP & Reductions", "estimated_hours": 5.0},
        ],
    },
    {
        "name": "Computer Organization",
        "code": "CS304",
        "description": "Instruction set architecture, ALU design, pipelining hazards, cache memory hierarchy, and I/O organization.",
        "semester": 3,
        "credits": 4,
        "priority": "Medium",
        "color": "#0284c7",
        "target_study_hours": 40.0,
        "topics": [
            {"chapter_number": 1, "chapter_title": "Data Representation & ALU", "module_name": "Unit 1", "topic_title": "IEEE 754 Floating Point, Booth's Multiplier & Carry Lookahead Adder", "estimated_hours": 4.0},
            {"chapter_number": 2, "chapter_title": "Control Unit & Pipelining", "module_name": "Unit 2", "topic_title": "Hardwired vs Microprogrammed Control, 5-Stage Pipeline Hazards", "estimated_hours": 5.0},
            {"chapter_number": 3, "chapter_title": "Cache & Memory Hierarchy", "module_name": "Unit 3", "topic_title": "Direct, Associative & Set-Associative Cache Mapping", "estimated_hours": 4.0},
        ],
    },
    {
        "name": "Web Development",
        "code": "CS504",
        "description": "Modern frontend architecture, React & TypeScript, REST APIs, authentication, databases, and cloud deployment.",
        "semester": 5,
        "credits": 3,
        "priority": "Medium",
        "color": "#ea580c",
        "target_study_hours": 40.0,
        "topics": [
            {"chapter_number": 1, "chapter_title": "HTML5, CSS3 & TypeScript", "module_name": "Unit 1", "topic_title": "Responsive Layouts, DOM APIs & Async JavaScript/TypeScript", "estimated_hours": 4.0},
            {"chapter_number": 2, "chapter_title": "React & State Management", "module_name": "Unit 2", "topic_title": "Hooks, Component Lifecycle, Routing & Form Validation", "estimated_hours": 5.0},
            {"chapter_number": 3, "chapter_title": "Backend APIs & Security", "module_name": "Unit 3", "topic_title": "REST Architecture, JWT Auth, CORS, ORM & SQL Injection Prevention", "estimated_hours": 5.0},
        ],
    },
    {
        "name": "Artificial Intelligence",
        "code": "CS601",
        "description": "Uninformed and heuristic search, adversarial games, constraint satisfaction, knowledge representation, and planning.",
        "semester": 6,
        "credits": 4,
        "priority": "Medium",
        "color": "#9333ea",
        "target_study_hours": 45.0,
        "topics": [
            {"chapter_number": 1, "chapter_title": "Search Algorithms", "module_name": "Unit 1", "topic_title": "BFS, Uniform Cost Search, A* Search & Heuristic Admissibility", "estimated_hours": 4.5},
            {"chapter_number": 2, "chapter_title": "Adversarial Search & CSPs", "module_name": "Unit 2", "topic_title": "Minimax, Alpha-Beta Pruning & Constraint Propagation", "estimated_hours": 4.0},
            {"chapter_number": 3, "chapter_title": "Logic & Probabilistic Reasoning", "module_name": "Unit 3", "topic_title": "First-Order Logic, Resolution & Bayesian Networks", "estimated_hours": 4.5},
        ],
    },
    {
        "name": "Machine Learning",
        "code": "CS602",
        "description": "Supervised and unsupervised learning, regression, classification, SVMs, ensemble methods, and neural networks.",
        "semester": 6,
        "credits": 4,
        "priority": "High",
        "color": "#e11d48",
        "target_study_hours": 50.0,
        "topics": [
            {"chapter_number": 1, "chapter_title": "Supervised Learning", "module_name": "Unit 1", "topic_title": "Linear/Logistic Regression, Gradient Descent & Regularization", "estimated_hours": 5.0},
            {"chapter_number": 2, "chapter_title": "Trees, Ensembles & SVMs", "module_name": "Unit 2", "topic_title": "Decision Trees, Random Forests, XGBoost & Kernel SVM", "estimated_hours": 5.0},
            {"chapter_number": 3, "chapter_title": "Unsupervised Learning & Neural Nets", "module_name": "Unit 3", "topic_title": "K-Means, PCA, Backpropagation & Deep Learning Basics", "estimated_hours": 5.5},
        ],
    },
    {
        "name": "Mathematics",
        "code": "MA301",
        "description": "Discrete mathematics, graph theory, combinatorics, linear algebra, probability, and statistical inference for CS.",
        "semester": 3,
        "credits": 4,
        "priority": "High",
        "color": "#16a34a",
        "target_study_hours": 45.0,
        "topics": [
            {"chapter_number": 1, "chapter_title": "Propositional Logic & Set Theory", "module_name": "Unit 1", "topic_title": "Predicates, Quantifiers, Relations, Lattices & Posets", "estimated_hours": 4.0},
            {"chapter_number": 2, "chapter_title": "Combinatorics & Graph Theory", "module_name": "Unit 2", "topic_title": "Generating Functions, Pigeonhole Principle & Euler/Hamiltonian Graphs", "estimated_hours": 4.5},
            {"chapter_number": 3, "chapter_title": "Linear Algebra & Probability", "module_name": "Unit 3", "topic_title": "Eigenvalues, SVD, Bayes Theorem & Random Variables", "estimated_hours": 5.0},
        ],
    },
]


def enrich_subject_response(subj: Subject) -> SubjectResponse:
    topics = subj.topics or []
    total_topics = len(topics)
    completed_topics = sum(1 for t in topics if t.is_completed)
    syllabus_pct = round((completed_topics / total_topics) * 100.0, 1) if total_topics > 0 else 0.0
    hours_pct = round(
        min(100.0, (subj.completed_study_hours / max(1.0, subj.target_study_hours)) * 100.0), 1
    )

    resp = SubjectResponse.model_validate(subj)
    resp.total_topics = total_topics
    resp.completed_topics = completed_topics
    resp.syllabus_completion_percentage = syllabus_pct
    resp.hours_completion_percentage = hours_pct
    return resp


@router.get("/defaults")
def get_default_cse_subjects(current_user: User = Depends(get_current_user)):
    """Return optional default CSE subjects catalog."""
    return {"defaults": DEFAULT_CSE_SUBJECTS}


@router.post("/seed-defaults", response_model=List[SubjectResponse])
def seed_default_subjects(
    subject_names: Optional[List[str]] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add selected (or all) default CSE subjects that the user doesn't already have."""
    existing_names = {
        s.name.lower() for s in db.query(Subject).filter(Subject.user_id == current_user.id).all()
    }
    created_subjects = []

    for item in DEFAULT_CSE_SUBJECTS:
        if subject_names and item["name"] not in subject_names:
            continue
        if item["name"].lower() in existing_names:
            continue

        subj = Subject(
            user_id=current_user.id,
            name=item["name"],
            code=item["code"],
            description=item["description"],
            semester=item["semester"],
            credits=item["credits"],
            priority=item["priority"],
            color=item["color"],
            target_study_hours=item["target_study_hours"],
            completed_study_hours=0.0,
        )
        db.add(subj)
        db.flush()

        for idx, t in enumerate(item.get("topics", [])):
            topic = SyllabusTopic(
                subject_id=subj.id,
                user_id=current_user.id,
                chapter_number=t["chapter_number"],
                chapter_title=t["chapter_title"],
                module_name=t["module_name"],
                topic_title=t["topic_title"],
                estimated_hours=t["estimated_hours"],
                is_completed=False,
                order_index=idx,
            )
            db.add(topic)

        created_subjects.append(subj)

    db.commit()
    for s in created_subjects:
        db.refresh(s)
    return [enrich_subject_response(s) for s in created_subjects]


@router.get("", response_model=List[SubjectResponse])
def list_subjects(
    search: Optional[str] = Query(None),
    semester: Optional[int] = Query(None),
    priority: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Subject).filter(Subject.user_id == current_user.id)
    if semester is not None:
        q = q.filter(Subject.semester == semester)
    if priority:
        q = q.filter(Subject.priority == priority)

    subjects = q.order_by(Subject.created_at.desc()).all()
    if search:
        s_low = search.strip().lower()
        subjects = [
            s
            for s in subjects
            if s_low in s.name.lower() or s_low in s.code.lower() or s_low in s.description.lower()
        ]
    return [enrich_subject_response(s) for s in subjects]


@router.post("", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(
    payload: SubjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    subj = Subject(
        user_id=current_user.id,
        name=payload.name.strip(),
        code=payload.code.strip(),
        description=payload.description.strip(),
        semester=payload.semester,
        credits=payload.credits,
        priority=payload.priority,
        color=payload.color,
        target_completion_date=payload.target_completion_date,
        target_study_hours=payload.target_study_hours,
        completed_study_hours=payload.completed_study_hours,
    )
    db.add(subj)
    db.flush()

    if payload.initial_topics:
        for idx, t in enumerate(payload.initial_topics):
            topic = SyllabusTopic(
                subject_id=subj.id,
                user_id=current_user.id,
                chapter_number=t.chapter_number,
                chapter_title=t.chapter_title,
                module_name=t.module_name,
                topic_title=t.topic_title,
                estimated_hours=t.estimated_hours,
                is_completed=t.is_completed,
                completed_at=datetime.now(timezone.utc) if t.is_completed else None,
                notes=t.notes,
                order_index=t.order_index or idx,
            )
            db.add(topic)

    db.commit()
    db.refresh(subj)
    return enrich_subject_response(subj)


@router.get("/{subject_id}", response_model=SubjectResponse)
def get_subject(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    subj = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found.")
    return enrich_subject_response(subj)


@router.put("/{subject_id}", response_model=SubjectResponse)
def update_subject(
    subject_id: int,
    payload: SubjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    subj = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(subj, field, val)

    db.commit()
    db.refresh(subj)
    return enrich_subject_response(subj)


@router.delete("/{subject_id}")
def delete_subject(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    subj = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found.")
    db.delete(subj)
    db.commit()
    return {"message": "Subject deleted successfully.", "id": subject_id}


@router.post("/{subject_id}/log-hours", response_model=SubjectResponse)
def log_subject_study_hours(
    subject_id: int,
    payload: SubjectStudyHoursLog,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    subj = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found.")

    subj.completed_study_hours = round(subj.completed_study_hours + payload.hours_to_add, 2)

    session_date = payload.session_date or date.today().isoformat()
    duration_minutes = int(round(payload.hours_to_add * 60))
    session = StudySession(
        user_id=current_user.id,
        subject_id=subj.id,
        topic_id=payload.topic_id,
        title=f"Study Session — {subj.name}",
        session_date=session_date,
        duration_minutes=duration_minutes,
        planned_minutes=duration_minutes,
        session_type="Self-study",
        notes=payload.notes or "",
    )
    db.add(session)
    db.commit()
    db.refresh(subj)
    return enrich_subject_response(subj)


# ==================== SYLLABUS TOPICS CRUD ====================

@router.post("/{subject_id}/topics", response_model=SyllabusTopicResponse, status_code=status.HTTP_201_CREATED)
def add_syllabus_topic(
    subject_id: int,
    payload: SyllabusTopicCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    subj = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found.")

    topic = SyllabusTopic(
        subject_id=subj.id,
        user_id=current_user.id,
        chapter_number=payload.chapter_number,
        chapter_title=payload.chapter_title.strip(),
        module_name=payload.module_name.strip(),
        topic_title=payload.topic_title.strip(),
        estimated_hours=payload.estimated_hours,
        is_completed=payload.is_completed,
        completed_at=datetime.now(timezone.utc) if payload.is_completed else None,
        notes=payload.notes,
        order_index=payload.order_index,
    )
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic


@router.put("/{subject_id}/topics/{topic_id}", response_model=SyllabusTopicResponse)
def update_syllabus_topic(
    subject_id: int,
    topic_id: int,
    payload: SyllabusTopicUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    topic = (
        db.query(SyllabusTopic)
        .filter(
            SyllabusTopic.id == topic_id,
            SyllabusTopic.subject_id == subject_id,
            SyllabusTopic.user_id == current_user.id,
        )
        .first()
    )
    if not topic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found.")

    update_data = payload.model_dump(exclude_unset=True)
    if "is_completed" in update_data:
        if update_data["is_completed"] and not topic.is_completed:
            topic.completed_at = datetime.now(timezone.utc)
        elif not update_data["is_completed"]:
            topic.completed_at = None

    for field, val in update_data.items():
        setattr(topic, field, val)

    db.commit()
    db.refresh(topic)
    return topic


@router.delete("/{subject_id}/topics/{topic_id}")
def delete_syllabus_topic(
    subject_id: int,
    topic_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    topic = (
        db.query(SyllabusTopic)
        .filter(
            SyllabusTopic.id == topic_id,
            SyllabusTopic.subject_id == subject_id,
            SyllabusTopic.user_id == current_user.id,
        )
        .first()
    )
    if not topic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found.")
    db.delete(topic)
    db.commit()
    return {"message": "Syllabus topic deleted.", "id": topic_id}
