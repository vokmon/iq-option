import {
  Firestore,
  DocumentSnapshot,
  QuerySnapshot,
  Query,
  CollectionReference,
} from "firebase-admin/firestore";
import { firebaseConfig, firestoreDatabase } from "../firebase.config.ts";

export class FirestoreRepo {
  private readonly isInitialized: boolean = false;
  private readonly db: Firestore | null = null;

  constructor() {
    if (!firebaseConfig.projectId) {
      return;
    }

    this.db = firestoreDatabase;
  }

  /**
   * Subscribe to real-time updates from a Firestore collection
   * @param collectionPath The path to the collection
   * @param callback Function to handle the updates
   * @param options Configuration options for the subscription
   */
  public subscribeToCollection(
    collectionPath: string,
    callback: (snapshot: QuerySnapshot) => void,
    options: {
      where?: { field: string; operator: string; value: any };
      orderBy?: { field: string; direction: "asc" | "desc" };
      limit?: number;
      onError?: (error: Error) => void;
    } = {}
  ): () => void {
    if (!this.db) {
      throw new Error("Firestore not initialized");
    }

    // Create a reference to the collection
    const collectionRef: CollectionReference =
      this.db.collection(collectionPath);
    let query: Query = collectionRef;

    // Apply where clause if specified
    if (options.where) {
      query = query.where(
        options.where.field,
        options.where.operator as any,
        options.where.value
      );
    }

    // Apply ordering if specified
    if (options.orderBy) {
      query = query.orderBy(options.orderBy.field, options.orderBy.direction);
    }

    // Apply limit if specified
    if (options.limit) {
      query = query.limit(options.limit);
    }

    // Set up the real-time listener
    const unsubscribe = query.onSnapshot(
      (snapshot) => {
        callback(snapshot);

        // // Process changes
        // snapshot.docChanges().forEach((change) => {
        //   if (change.type === "added") {
        //     // Handle new document
        //     console.log("New document:", change.doc.id);
        //   } else if (change.type === "modified") {
        //     // Handle modified document
        //     console.log("Modified document:", change.doc.id);
        //   } else if (change.type === "removed") {
        //     // Handle removed document
        //     console.log("Removed document:", change.doc.id);
        //   }
        // });
      },
      (error) => {
        console.error("Error in Firestore subscription:", error);
        if (options.onError) {
          options.onError(error);
        }
      }
    );

    // Return the unsubscribe function
    return unsubscribe;
  }
}
