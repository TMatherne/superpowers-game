import * as async from "async";
import CubicModelAsset from "../data/CubicModelAsset";
import CubicModelRenderer from "./CubicModelRenderer";
let THREE = SupEngine.THREE;

export default class CubicModelRendererUpdater {

  client: SupClient.ProjectClient;
  cubicModelRenderer: CubicModelRenderer;

  receiveAssetCallbacks: any;
  editAssetCallbacks: any;

  cubicModelAssetId: string;
  cubicModelAsset: CubicModelAsset = null;

  cubicModelSubscriber = {
    onAssetReceived: this._onCubicModelAssetReceived.bind(this),
    onAssetEdited: this._onCubicModelAssetEdited.bind(this),
    onAssetTrashed: this._onCubicModelAssetTrashed.bind(this)
  };

  constructor(client: SupClient.ProjectClient, cubicModelRenderer: CubicModelRenderer, config: any, receiveAssetCallbacks: any, editAssetCallbacks: any) {
    this.client = client;
    this.cubicModelRenderer = cubicModelRenderer;
    this.receiveAssetCallbacks = receiveAssetCallbacks;
    this.editAssetCallbacks = editAssetCallbacks;

    this.cubicModelAssetId = config.cubicModelAssetId;

    if (this.cubicModelAssetId != null) this.client.subAsset(this.cubicModelAssetId, "cubicModel", this.cubicModelSubscriber);
  }

  destroy() {
    if (this.cubicModelAssetId != null) this.client.unsubAsset(this.cubicModelAssetId, this.cubicModelSubscriber);
  }

  _onCubicModelAssetReceived(assetId: string, asset: CubicModelAsset) {
    this.cubicModelAsset = asset;
    this._setCubicModel();
    if (this.receiveAssetCallbacks != null) this.receiveAssetCallbacks.cubicModel();
  }

  _setCubicModel() {
    if (this.cubicModelAsset == null) {
      this.cubicModelRenderer.setModel(null);
      return;
    }

    this.cubicModelRenderer.setModel(this.cubicModelAsset.pub);
  }


  _onCubicModelAssetEdited(id: string, command: string, ...args: any[]) {
    let commandCallback = (<any>this)[`_onEditCommand_${command}`];
    if (commandCallback != null) commandCallback.apply(this, args);

    if (this.editAssetCallbacks != null) {
      let editCallback = this.editAssetCallbacks.cubicModel[command];
      if (editCallback != null) editCallback.apply(null, args);
    }
  }

  _onEditCommand_addNode(node: Node, parentId: string, index: number) {
    //this.cubicModelRenderer.addNode();
  }

  _onEditCommand_moveNode = (id: string, parentId: string, index: number) => {
    /*let nodeActor = this.bySceneNodeId[id].actor;
    let parentNodeActor = (this.bySceneNodeId[parentId] != null) ? this.bySceneNodeId[parentId].actor : null;
    nodeActor.setParent(parentNodeActor);
    this._onUpdateMarkerRecursive(id);*/
  }

  _onEditCommand_setNodeProperty = (id: string, path: string, value: any) => {
    let rendererNode = this.cubicModelRenderer.byNodeId[id];

    switch (path) {
      case "position":
        rendererNode.pivot.position.set(value.x, value.y, value.z);
        rendererNode.pivot.updateMatrixWorld(false);
        /*nodeEditorData.actor.setLocalPosition(value);
        nodeEditorData.markerActor.setGlobalPosition(nodeEditorData.actor.getGlobalPosition());
        this._onUpdateMarkerRecursive(id);*/
        break;
      case "orientation":
        rendererNode.pivot.quaternion.set(value.x, value.y, value.z, value.w);
        rendererNode.pivot.updateMatrixWorld(false);
        /*nodeEditorData.actor.setLocalOrientation(value);
        nodeEditorData.markerActor.setGlobalOrientation(nodeEditorData.actor.getGlobalOrientation());
        this._onUpdateMarkerRecursive(id);*/
        break;
    }
  }


  _onCubicModelAssetTrashed() {
    this.cubicModelAsset = null;
    this.cubicModelRenderer.setModel(null);
    // FIXME: the updater shouldn't be dealing with SupClient.onAssetTrashed directly
    if (this.editAssetCallbacks != null) SupClient.onAssetTrashed();
  }

  config_setProperty(path: string, value: any) {
    switch(path) {
      case "cubicModelAssetId":
        if (this.cubicModelAssetId != null) this.client.unsubAsset(this.cubicModelAssetId, this.cubicModelSubscriber);
        this.cubicModelAssetId = value;

        this.cubicModelAsset = null;
        this.cubicModelRenderer.setModel(null, null);

        if (this.cubicModelAssetId != null) this.client.subAsset(this.cubicModelAssetId, "cubicModel", this.cubicModelSubscriber);
        break;
    }
  }
}
